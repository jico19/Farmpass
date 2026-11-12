"""Quarterly census rules shared by maps, dashboards and imports."""
import calendar
import unicodedata
from datetime import date

from django.utils import timezone

from .models import Barangay, HogSurvey


def normalize(value):
    value = unicodedata.normalize("NFKD", value or "")
    return " ".join("".join(c for c in value if not unicodedata.combining(c)).casefold().split())


def quarter_of(value):
    return value.year, (value.month - 1) // 3 + 1


def quarter_end(year, quarter):
    month = quarter * 3
    return date(year, month, calendar.monthrange(year, month)[1])


def period_status(period, today=None):
    """Return calendar completion independently from reporting coverage."""
    today = timezone.localdate() if today is None else today
    return "completed" if quarter_end(*period) <= today else "in_progress"


def latest_completed_period(queryset=None, year=None, today=None):
    """Newest observed quarter whose calendar end is not after local today."""
    queryset = HogSurvey.objects.all() if queryset is None else queryset
    today = timezone.localdate() if today is None else today
    queryset = queryset.filter(survey_date__isnull=False, survey_date__lte=today)
    if year is not None:
        queryset = queryset.filter(survey_date__year=year)
    periods = queryset.values_list("survey_date__year", "survey_date__quarter").distinct()
    return max(
        (period for period in periods if quarter_end(*period) <= today),
        default=None,
    )


def classify(total):
    if total is None:
        return "No data"
    if total == 0:
        return "None"
    if total < 100:
        return "Low"
    if total < 500:
        return "Medium"
    if total < 1500:
        return "High"
    return "Very High"


def census_rows(observations, period, barangays):
    """Keep the last observation per normalized raiser identity in one quarter.

    Legacy unnamed rows cannot identify a raiser, so remain separate observations.
    Totals always come from categories, including for older inconsistent records.
    """
    barangays = list(barangays)
    allowed_ids = {b.pk for b in barangays}
    latest = {}
    for survey in observations:
        if survey.barangay_id not in allowed_ids or not survey.survey_date or quarter_of(survey.survey_date) != period:
            continue
        identity = normalize(survey.farmer_name) or ("unnamed", survey.pk if survey.pk is not None else id(survey))
        key = (survey.barangay_id, identity)
        old = latest.get(key)
        if old is None or (survey.survey_date, survey.pk or 0) > (old.survey_date, old.pk or 0):
            latest[key] = survey

    groups = {}
    for survey in latest.values():
        groups.setdefault(survey.barangay_id, []).append(survey)
    result = []
    for barangay in barangays:
        rows = groups.get(barangay.pk, [])
        breakdown = {field: sum(getattr(s, field) for s in rows) for field in HogSurvey.PIG_FIELDS}
        total = sum(breakdown.values()) if rows else None
        result.append({
            "barangay": barangay.name,
            "latitude": barangay.latitude,
            "longitude": barangay.longitude,
            "total_pigs": total,
            "density_level": classify(total),
            "breakdown": breakdown,
            "trend": "stable",
            "is_prediction": False,
            "census_date": quarter_end(*period).isoformat() if period else None,
            "survey_date": max(s.survey_date for s in rows).isoformat() if rows else None,
            "year": period[0] if period else None,
            "quarter": period[1] if period else None,
            "period_status": period_status(period) if period else None,
            "has_observations": bool(rows),
            "raiser_count": len(rows),
        })
    coverage = {"observed_barangays": len(groups), "total_barangays": len(result)}
    for row in result:
        row["coverage"] = coverage
    return result


def current_census(queryset=None, barangays=None):
    queryset = HogSurvey.objects.all() if queryset is None else queryset
    barangays = Barangay.objects.all() if barangays is None else barangays
    period = latest_completed_period(queryset)
    observations = queryset.filter(survey_date__year=period[0], survey_date__quarter=period[1]) if period else []
    return census_rows(observations, period, barangays)


def census_periods(queryset=None, barangays=None, year=None):
    """Describe observed census periods and their calendar/coverage status."""
    queryset = HogSurvey.objects.all() if queryset is None else queryset
    barangays = list(Barangay.objects.all() if barangays is None else barangays)
    observations = list(queryset.filter(survey_date__isnull=False).order_by("survey_date", "pk"))
    periods = sorted({quarter_of(survey.survey_date) for survey in observations}, reverse=True)
    if year is not None:
        periods = [period for period in periods if period[0] == year]
    default_period = latest_completed_period(queryset, year=year)
    metadata = []
    for period in periods:
        rows = census_rows(observations, period, barangays)
        coverage = rows[0]["coverage"] if rows else {
            "observed_barangays": 0,
            "total_barangays": len(barangays),
        }
        metadata.append({
            "year": period[0],
            "quarter": period[1],
            "census_date": quarter_end(*period).isoformat(),
            "period_status": period_status(period),
            "coverage": coverage,
            "is_default": period == default_period,
        })
    return metadata, default_period


def census_history(queryset, barangays):
    observations = list(queryset.filter(survey_date__isnull=False).order_by("survey_date", "pk"))
    periods = sorted({quarter_of(s.survey_date) for s in observations})
    barangays = list(barangays)
    return [row for period in periods for row in census_rows(observations, period, barangays)]
