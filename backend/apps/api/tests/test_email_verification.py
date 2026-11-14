from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.api.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class EmailVerificationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="missing_email",
            password="password123",
        )
        self.client.force_authenticate(user=self.user)

    def test_code_verifies_first_email(self):
        response = self.client.post(
            reverse("user-request-email-verification"),
            {"email": "Working.Email@example.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        code = cache.get(f"email_verification:{self.user.pk}")["code"]
        message = mail.outbox[0]
        self.assertIn(code, message.body)
        self.assertEqual(len(message.alternatives), 1)
        html, content_type = message.alternatives[0]
        self.assertEqual(content_type, "text/html")
        self.assertIn(code, html)
        self.assertIn("expires in 10 minutes", html)
        response = self.client.post(
            reverse("user-confirm-email-verification"),
            {"email": "working.email@example.com", "code": code},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "working.email@example.com")
        self.assertIsNotNone(self.user.email_verified_at)

    def test_code_request_has_sixty_second_cooldown(self):
        url = reverse("user-request-email-verification")
        self.assertEqual(self.client.post(url, {"email": "one@example.com"}).status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.post(url, {"email": "one@example.com"}).status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_profile_patch_cannot_bypass_verification(self):
        response = self.client.patch(
            reverse("user-detail", kwargs={"pk": self.user.pk}),
            {"email": "unverified@example.com"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertFalse(self.user.email)
