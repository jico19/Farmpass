from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string


def send_branded_email(*, subject, text_body, recipient, template_name, context):
    message = EmailMultiAlternatives(
        subject,
        text_body,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
    )
    message.attach_alternative(render_to_string(template_name, context), "text/html")
    message.send()
