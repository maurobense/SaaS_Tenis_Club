namespace TennisClubSaaS.Domain.Enums;

public enum UserRole { SuperAdmin = 1, ClubAdmin = 2, Coach = 3, Member = 4 }
public enum TenantPlanType { Basic = 1, Pro = 2, Premium = 3, Custom = 4 }
public enum TenantBillingStatus { Trial = 1, Active = 2, PastDue = 3, Suspended = 4, Cancelled = 5 }
public enum MembershipStatus { Active = 1, Inactive = 2, Pending = 3, Overdue = 4, Suspended = 5 }
public enum MonthlyMembershipStatus { Pending = 1, Paid = 2, Overdue = 3, Cancelled = 4, Exempted = 5 }
public enum SurfaceType { Clay = 1, Hard = 2, Grass = 3, Synthetic = 4, Other = 5 }
public enum CourtLocationType { Indoor = 1, Outdoor = 2 }
public enum ReservationStatus { Pending = 1, Confirmed = 2, Cancelled = 3, Completed = 4, NoShow = 5 }
public enum ReservationType { MemberBooking = 1, AdminBooking = 2, Maintenance = 3, Tournament = 4, ClassBlock = 5, Weather = 6, InternalUse = 7 }
public enum ReservationPlayFormat { Singles = 1, Doubles = 2 }
public enum ClassLevel { Beginner = 1, Intermediate = 2, Advanced = 3, Kids = 4, Adults = 5, Competition = 6, Custom = 7 }
public enum EnrollmentStatus { Active = 1, WaitingList = 2, Cancelled = 3, Removed = 4 }
public enum ClassSessionStatus { Scheduled = 1, Completed = 2, Cancelled = 3 }
public enum AttendanceStatus { Present = 1, Absent = 2, Late = 3, Justified = 4 }
public enum PaymentMethod { Cash = 1, BankTransfer = 2, Card = 3, MercadoPago = 4, Other = 5 }
public enum PaymentPurpose { Membership = 1, CourtGuestFee = 2, CourtReservation = 3, Other = 4 }
public enum PaymentStatus { Pending = 1, Paid = 2, Failed = 3, Refunded = 4, Cancelled = 5 }
public enum NotificationType { Payment = 1, Reservation = 2, Class = 3, System = 4, Membership = 5 }
public enum SettingValueType { String = 1, Number = 2, Boolean = 3, Time = 4, Color = 5, Json = 6 }
