import re

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.api.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="reset_user",
            email="farmer@example.com",
            password="old-password-123",
        )

    def test_request_and_confirm_password_reset(self):
        response = self.client.post(
            reverse("password_reset"), {"email": "FARMER@example.com"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        message = mail.outbox[0]
        self.assertIn("/reset-password/", message.body)
        self.assertEqual(len(message.alternatives), 1)
        html, content_type = message.alternatives[0]
        self.assertEqual(content_type, "text/html")
        self.assertIn("Reset Password", html)

        uid, token = re.search(
            r"/reset-password/([^/]+)/([^\s/]+)", message.body
        ).groups()
        self.assertIn(f"/reset-password/{uid}/{token}", html)
        response = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": uid, "token": token, "password": "new-secure-password-456"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-secure-password-456"))

    def test_request_does_not_reveal_unknown_email(self):
        response = self.client.post(
            reverse("password_reset"), {"email": "missing@example.com"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(mail.outbox, [])

    def test_invalid_token_is_rejected(self):
        response = self.client.post(
            reverse("password_reset_confirm"),
            {"uid": "invalid", "token": "invalid", "password": "new-password-456"},
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_registration_rejects_email_case_insensitively(self):
        response = self.client.post(
            reverse("user-list"),
            {
                "username": "another_user",
                "email": "FARMER@EXAMPLE.COM",
                "password": "another-secure-password-456",
                "phone_no": "09123456789",
            },
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data["error"])

    def test_reset_requests_wait_one_minute(self):
        url = reverse("password_reset")
        self.assertEqual(
            self.client.post(url, {"email": self.user.email}).status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.post(url, {"email": self.user.email}).status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )
