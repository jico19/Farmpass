from django.db import migrations, models


def normalize_emails(apps, schema_editor):
    User = apps.get_model("api", "User")
    seen = set()
    for user in User.objects.exclude(email="").exclude(email__isnull=True).iterator():
        email = user.email.strip().lower()
        if email in seen:
            raise RuntimeError(f"Duplicate user email must be resolved before migration: {email}")
        seen.add(email)
        user.email = email
        user.save(update_fields=["email"])
    User.objects.filter(email="").update(email=None)


class Migration(migrations.Migration):
    dependencies = [("api", "0014_alter_audittrail_options_audittrail_action_type_and_more")]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.RunPython(normalize_emails, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="email",
            field=models.EmailField(blank=True, max_length=254, null=True, unique=True),
        ),
    ]
