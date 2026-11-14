from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("api", "0015_user_unique_email")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="email_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
