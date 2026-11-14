from django.http import JsonResponse
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework.throttling import SimpleRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .emails import send_branded_email

class LoginRateThrottle(SimpleRateThrottle):
    rate = '5/min'
    scope = 'login'

    def get_cache_key(self, request, view):
        username = request.data.get('username', '').strip()
        ip = self.get_ident(request)
        
        if username:
            return self.cache_format % {
                'scope': self.scope,
                'ident': f"{ip}_{username}"
            }
        return self.cache_format % {
            'scope': self.scope,
            'ident': ip
        }

class LoginIPRateThrottle(SimpleRateThrottle):
    rate = '20/min'
    scope = 'login_ip'

    def get_cache_key(self, request, view):
        return self.cache_format % {
            'scope': self.scope,
            'ident': self.get_ident(request)
        }

class CustomTokenObtainPairView(TokenObtainPairView):
    throttle_classes = [LoginRateThrottle, LoginIPRateThrottle]


class PasswordResetRequestThrottle(SimpleRateThrottle):
    rate = "1/minute"
    scope = "password_reset"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [PasswordResetRequestThrottle]

    def post(self, request):
        email = serializers.EmailField().run_validation(request.data.get("email"))
        user = get_user_model().objects.filter(
            email__iexact=email.strip(), is_active=True
        ).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password/{uid}/{token}"
            recipient_name = user.get_full_name().strip() or user.username
            send_branded_email(
                subject="Reset your FarmPass password",
                text_body=(
                    f"Dear {recipient_name},\n\n"
                    "We received a request to reset your FarmPass password. "
                    "Use the link below to choose a new password:\n\n"
                    f"{reset_url}\n\n"
                    "If you did not request this, ignore this email. Your password will remain unchanged."
                ),
                recipient=user.email,
                template_name="api/email/password_reset.html",
                context={"recipient_name": recipient_name, "reset_url": reset_url},
            )
        return Response({
            "detail": "If an active account uses that email, a password reset link has been sent."
        })


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            user_id = force_str(urlsafe_base64_decode(request.data.get("uid", "")))
            user = get_user_model().objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, get_user_model().DoesNotExist):
            return Response({"detail": "This password reset link is invalid or expired."}, status=400)

        token = request.data.get("token", "")
        if not default_token_generator.check_token(user, token):
            return Response({"detail": "This password reset link is invalid or expired."}, status=400)

        password = request.data.get("password", "")
        try:
            validate_password(password, user=user)
        except DjangoValidationError as error:
            return Response({"password": list(error.messages)}, status=400)

        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Your password has been reset successfully."})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except TokenError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# this will keep the render awake..
def health_check(request):
    return JsonResponse({"message": "ok!!"})


def _authenticate_media_user(request):
    """
    Authenticates a media request from:
    1. Authorization: Bearer <token> header
    2. ?token=<token> query parameter (for browser previews, downloads, img tags)
    3. Active session (request.user), only when no token was supplied
    """
    raw_token = None
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION")
    if auth_header and auth_header.startswith("Bearer "):
        raw_token = auth_header.split(" ", 1)[1].strip()

    if not raw_token:
        raw_token = request.GET.get("token")

    if raw_token:
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

        jwt_auth = JWTAuthentication()
        try:
            validated_token = jwt_auth.get_validated_token(raw_token)
            return jwt_auth.get_user(validated_token)
        except (InvalidToken, TokenError, Exception):
            return None

    if getattr(request, "user", None) and request.user.is_authenticated:
        return request.user

    return None


def secure_serve_media(request, path):
    """
    Secure media serving view.
    Enforces authentication and role/ownership checks before serving uploaded files.
    Staff (Agri, Admin, Opv) can access all media.
    Farmers can access their own uploaded docs, issued permits, and AICs.
    Inspectors can access issued permits and verification docs.
    """
    user = _authenticate_media_user(request)
    if not user or not user.is_authenticated:
        return JsonResponse({"detail": "Authentication credentials were not provided."}, status=401)

    normalized_path = path.replace("\\", "/").lstrip("/")

    # Public assets (e.g. logos) can be served to any authenticated user
    if normalized_path.startswith("asset/") or "logo" in normalized_path:
        from django.views.static import serve
        from django.conf import settings
        return serve(request, normalized_path, document_root=settings.MEDIA_ROOT)

    # Privileged staff can access all operational files
    if getattr(user, "role", None) in ["Agri", "Admin", "Opv"]:
        from django.views.static import serve
        from django.conf import settings
        return serve(request, normalized_path, document_root=settings.MEDIA_ROOT)

    # Retained legacy files do not authorize release of unfinished applications.
    if getattr(user, "role", None) in ["Farmer", "Inspector"]:
        from django.db.models import Q
        from apps.permits.models import PermitApplication
        withheld = PermitApplication.objects.exclude(status=PermitApplication.Status.RELEASED).filter(
            Q(mao_confirmed_at__isnull=True) | Q(mao_confirmed_by__isnull=True) | Q(mao_confirmation_reference=""),
        ).filter(
            Q(mao_certificate_pdf=normalized_path)
            | Q(issued_permit__mao_certificate_pdf=normalized_path)
            | Q(issued_permit__permit_pdf=normalized_path),
        ).exists()
        if withheld:
            return JsonResponse({"detail": "MAO Certificate confirmation is required before release."}, status=403)

    # Inspectors can view issued permits, AICs, and OPV clearance docs for verification
    if getattr(user, "role", None) == "Inspector":
        if (
            normalized_path.startswith("issued_docs/")
            or normalized_path.startswith("opv_docs/")
            or normalized_path.endswith(".pdf")
        ):
            from django.views.static import serve
            from django.conf import settings
            return serve(request, normalized_path, document_root=settings.MEDIA_ROOT)
        return JsonResponse({"detail": "Access denied to requested document."}, status=403)

    # Barangay officials can view submitted documents from farmers in their barangay, and endorsement files
    if getattr(user, "role", None) == "Barangay":
        from apps.permits.models import SubmittedDocument, PermitApplicationDocument

        is_barangay_doc = (
            SubmittedDocument.objects.filter(origin__application__farmer__barangay=user.barangay, file__icontains=normalized_path).exists()
            or PermitApplicationDocument.objects.filter(application__farmer__barangay=user.barangay, file__icontains=normalized_path).exists()
            or normalized_path.startswith("endorsements/")
            or normalized_path.startswith("hog_surveys/")
        )
        if is_barangay_doc:
            from django.views.static import serve
            from django.conf import settings
            return serve(request, normalized_path, document_root=settings.MEDIA_ROOT)
        return JsonResponse({"detail": "Access denied to requested document."}, status=403)

    # Farmers can access files attached to their own applications or user profile
    if getattr(user, "role", None) == "Farmer":
        from apps.permits.models import SubmittedDocument, PermitApplicationDocument, IssuedPermit, PermitApplication, OPVValidation
        from apps.api.models import FarmerDocument

        is_owner = (
            SubmittedDocument.objects.filter(origin__application__farmer=user, file__icontains=normalized_path).exists()
            or PermitApplicationDocument.objects.filter(application__farmer=user, file__icontains=normalized_path).exists()
            or IssuedPermit.objects.filter(application__farmer=user, permit_pdf__icontains=normalized_path).exists()
            or IssuedPermit.objects.filter(application__farmer=user, aic_pdf__icontains=normalized_path).exists()
            or PermitApplication.objects.filter(farmer=user, aic_pdf__icontains=normalized_path).exists()
            or IssuedPermit.objects.filter(application__farmer=user, mao_certificate_pdf=normalized_path).exists()
            or PermitApplication.objects.filter(farmer=user, mao_certificate_pdf=normalized_path).exists()
            or OPVValidation.objects.filter(application__farmer=user, veterinary_health_certificate=normalized_path).exists()
            or OPVValidation.objects.filter(application__farmer=user, transportation_pass=normalized_path).exists()
            or FarmerDocument.objects.filter(user=user, file__icontains=normalized_path).exists()
        )
        if is_owner:
            from django.views.static import serve
            from django.conf import settings
            return serve(request, normalized_path, document_root=settings.MEDIA_ROOT)
        return JsonResponse({"detail": "You do not have permission to access this file."}, status=403)

    return JsonResponse({"detail": "Forbidden."}, status=403)
