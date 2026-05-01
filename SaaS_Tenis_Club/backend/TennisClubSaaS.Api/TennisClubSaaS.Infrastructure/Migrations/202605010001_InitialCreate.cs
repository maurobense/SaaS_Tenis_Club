using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TennisClubSaaS.Infrastructure.Migrations;

public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
IF OBJECT_ID('ClubTenants') IS NULL
CREATE TABLE ClubTenants (
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  Name nvarchar(160) NOT NULL,
  Slug nvarchar(80) NOT NULL,
  ContactEmail nvarchar(256) NOT NULL,
  ContactPhone nvarchar(80) NULL,
  LogoUrl nvarchar(600) NULL,
  PrimaryColor nvarchar(20) NOT NULL,
  SecondaryColor nvarchar(20) NOT NULL,
  Address nvarchar(400) NULL,
  IsActive bit NOT NULL,
  CreatedAt datetime2 NOT NULL,
  UpdatedAt datetime2 NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ClubTenants_Slug') CREATE UNIQUE INDEX IX_ClubTenants_Slug ON ClubTenants(Slug);

IF OBJECT_ID('AppUsers') IS NULL
CREATE TABLE AppUsers (
  Id uniqueidentifier NOT NULL PRIMARY KEY,
  ClubTenantId uniqueidentifier NOT NULL,
  ClubTenantIdNullable uniqueidentifier NULL,
  FirstName nvarchar(120) NOT NULL,
  LastName nvarchar(120) NOT NULL,
  Email nvarchar(180) NOT NULL,
  Phone nvarchar(80) NULL,
  PasswordHash nvarchar(300) NOT NULL,
  Role int NOT NULL,
  IsActive bit NOT NULL,
  LastLoginAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL,
  UpdatedAt datetime2 NULL,
  IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_AppUsers_ClubTenants FOREIGN KEY (ClubTenantId) REFERENCES ClubTenants(Id)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_AppUsers_Tenant_Email') CREATE UNIQUE INDEX IX_AppUsers_Tenant_Email ON AppUsers(ClubTenantId, Email);

IF OBJECT_ID('RefreshTokens') IS NULL
CREATE TABLE RefreshTokens (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL,
  TokenHash nvarchar(300) NOT NULL, ExpiresAt datetime2 NOT NULL, RevokedAt datetime2 NULL, ReplacedByTokenHash nvarchar(300) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_RefreshTokens_AppUsers FOREIGN KEY (UserId) REFERENCES AppUsers(Id)
);

IF OBJECT_ID('MemberProfiles') IS NULL
CREATE TABLE MemberProfiles (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL,
  MemberNumber nvarchar(80) NOT NULL, DocumentNumber nvarchar(80) NULL, BirthDate date NULL,
  EmergencyContactName nvarchar(180) NULL, EmergencyContactPhone nvarchar(80) NULL, MembershipStatus int NOT NULL,
  JoinedAt datetime2 NOT NULL, Notes nvarchar(max) NULL, NoShowCount int NOT NULL DEFAULT 0,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_MemberProfiles_AppUsers FOREIGN KEY (UserId) REFERENCES AppUsers(Id)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_MemberProfiles_Number') CREATE UNIQUE INDEX IX_MemberProfiles_Number ON MemberProfiles(ClubTenantId, MemberNumber);

IF OBJECT_ID('CoachProfiles') IS NULL
CREATE TABLE CoachProfiles (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL,
  Bio nvarchar(max) NULL, Specialty nvarchar(200) NULL, IsActive bit NOT NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_CoachProfiles_AppUsers FOREIGN KEY (UserId) REFERENCES AppUsers(Id)
);

IF OBJECT_ID('Courts') IS NULL
CREATE TABLE Courts (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, Name nvarchar(120) NOT NULL,
  SurfaceType int NOT NULL, IndoorOutdoor int NOT NULL, HasLights bit NOT NULL, IsActive bit NOT NULL,
  OpeningTime time NOT NULL, ClosingTime time NOT NULL, SlotDurationMinutes int NOT NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0
);

IF OBJECT_ID('CourtAvailabilities') IS NULL
CREATE TABLE CourtAvailabilities (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, CourtId uniqueidentifier NOT NULL,
  DayOfWeek int NOT NULL, StartTime time NOT NULL, EndTime time NOT NULL, IsAvailable bit NOT NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_CourtAvailabilities_Courts FOREIGN KEY (CourtId) REFERENCES Courts(Id)
);

IF OBJECT_ID('Memberships') IS NULL
CREATE TABLE Memberships (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, MemberProfileId uniqueidentifier NOT NULL,
  Month int NOT NULL, Year int NOT NULL, Amount decimal(18,2) NOT NULL, Status int NOT NULL,
  DueFromDay int NOT NULL, DueToDay int NOT NULL, PaidAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_Memberships_Members FOREIGN KEY (MemberProfileId) REFERENCES MemberProfiles(Id)
);

IF OBJECT_ID('Reservations') IS NULL
CREATE TABLE Reservations (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, CourtId uniqueidentifier NOT NULL,
  MemberProfileId uniqueidentifier NULL, StartDateTime datetime2 NOT NULL, EndDateTime datetime2 NOT NULL,
  Status int NOT NULL, ReservationType int NOT NULL, CancelledAt datetime2 NULL, CancellationReason nvarchar(500) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_Reservations_Courts FOREIGN KEY (CourtId) REFERENCES Courts(Id),
  CONSTRAINT FK_Reservations_Members FOREIGN KEY (MemberProfileId) REFERENCES MemberProfiles(Id)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_Reservations_Tenant_Court_Time') CREATE INDEX IX_Reservations_Tenant_Court_Time ON Reservations(ClubTenantId, CourtId, StartDateTime, EndDateTime);

IF OBJECT_ID('TrainingClasses') IS NULL
CREATE TABLE TrainingClasses (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, Name nvarchar(120) NOT NULL,
  Description nvarchar(max) NULL, CoachId uniqueidentifier NOT NULL, CourtId uniqueidentifier NULL, DayOfWeek int NOT NULL,
  StartTime time NOT NULL, EndTime time NOT NULL, MaxStudents int NOT NULL, Level int NOT NULL, IsActive bit NOT NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_TrainingClasses_Coaches FOREIGN KEY (CoachId) REFERENCES CoachProfiles(Id),
  CONSTRAINT FK_TrainingClasses_Courts FOREIGN KEY (CourtId) REFERENCES Courts(Id)
);

IF OBJECT_ID('ClassEnrollments') IS NULL
CREATE TABLE ClassEnrollments (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, TrainingClassId uniqueidentifier NOT NULL,
  MemberProfileId uniqueidentifier NOT NULL, Status int NOT NULL, EnrolledAt datetime2 NOT NULL, CancelledAt datetime2 NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_ClassEnrollments_Classes FOREIGN KEY (TrainingClassId) REFERENCES TrainingClasses(Id),
  CONSTRAINT FK_ClassEnrollments_Members FOREIGN KEY (MemberProfileId) REFERENCES MemberProfiles(Id)
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ClassEnrollments_Unique') CREATE UNIQUE INDEX IX_ClassEnrollments_Unique ON ClassEnrollments(ClubTenantId, TrainingClassId, MemberProfileId);

IF OBJECT_ID('ClassSessions') IS NULL
CREATE TABLE ClassSessions (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, TrainingClassId uniqueidentifier NOT NULL,
  SessionDate date NOT NULL, StartDateTime datetime2 NOT NULL, EndDateTime datetime2 NOT NULL, Status int NOT NULL, Notes nvarchar(max) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_ClassSessions_Classes FOREIGN KEY (TrainingClassId) REFERENCES TrainingClasses(Id)
);

IF OBJECT_ID('ClassAttendances') IS NULL
CREATE TABLE ClassAttendances (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, ClassSessionId uniqueidentifier NOT NULL,
  MemberProfileId uniqueidentifier NOT NULL, AttendanceStatus int NOT NULL, Notes nvarchar(max) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_ClassAttendances_Sessions FOREIGN KEY (ClassSessionId) REFERENCES ClassSessions(Id),
  CONSTRAINT FK_ClassAttendances_Members FOREIGN KEY (MemberProfileId) REFERENCES MemberProfiles(Id)
);

IF OBJECT_ID('ClubSettings') IS NULL
CREATE TABLE ClubSettings (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, [Key] nvarchar(120) NOT NULL, [Value] nvarchar(max) NOT NULL,
  ValueType int NOT NULL, Description nvarchar(400) NULL, CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name='IX_ClubSettings_Key') CREATE UNIQUE INDEX IX_ClubSettings_Key ON ClubSettings(ClubTenantId, [Key]);

IF OBJECT_ID('Payments') IS NULL
CREATE TABLE Payments (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, MemberProfileId uniqueidentifier NOT NULL, MembershipId uniqueidentifier NULL,
  Amount decimal(18,2) NOT NULL, PaymentDate datetime2 NOT NULL, PaymentMethod int NOT NULL, Status int NOT NULL, Reference nvarchar(180) NULL, Notes nvarchar(max) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_Payments_Members FOREIGN KEY (MemberProfileId) REFERENCES MemberProfiles(Id),
  CONSTRAINT FK_Payments_Memberships FOREIGN KEY (MembershipId) REFERENCES Memberships(Id)
);

IF OBJECT_ID('Notifications') IS NULL
CREATE TABLE Notifications (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NOT NULL,
  Title nvarchar(180) NOT NULL, Message nvarchar(max) NOT NULL, Type int NOT NULL, IsRead bit NOT NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0,
  CONSTRAINT FK_Notifications_AppUsers FOREIGN KEY (UserId) REFERENCES AppUsers(Id)
);

IF OBJECT_ID('AuditLogs') IS NULL
CREATE TABLE AuditLogs (
  Id uniqueidentifier NOT NULL PRIMARY KEY, ClubTenantId uniqueidentifier NOT NULL, UserId uniqueidentifier NULL,
  Action nvarchar(160) NOT NULL, EntityName nvarchar(160) NOT NULL, EntityId nvarchar(80) NULL, OldValues nvarchar(max) NULL, NewValues nvarchar(max) NULL,
  CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NULL, IsDeleted bit NOT NULL DEFAULT 0
);
""");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
DROP TABLE IF EXISTS AuditLogs; DROP TABLE IF EXISTS Notifications; DROP TABLE IF EXISTS Payments; DROP TABLE IF EXISTS ClubSettings;
DROP TABLE IF EXISTS ClassAttendances; DROP TABLE IF EXISTS ClassSessions; DROP TABLE IF EXISTS ClassEnrollments; DROP TABLE IF EXISTS TrainingClasses;
DROP TABLE IF EXISTS Reservations; DROP TABLE IF EXISTS Memberships; DROP TABLE IF EXISTS CourtAvailabilities; DROP TABLE IF EXISTS Courts;
DROP TABLE IF EXISTS CoachProfiles; DROP TABLE IF EXISTS MemberProfiles; DROP TABLE IF EXISTS RefreshTokens; DROP TABLE IF EXISTS AppUsers; DROP TABLE IF EXISTS ClubTenants;
""");
    }
}
