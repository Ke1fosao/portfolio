from rest_framework.throttling import AnonRateThrottle


class LeadBurstThrottle(AnonRateThrottle):
    scope = 'lead_burst'


class LeadHourlyThrottle(AnonRateThrottle):
    scope = 'lead_hourly'
