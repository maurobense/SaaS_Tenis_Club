IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NULL,
        [Action] nvarchar(max) NOT NULL,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] nvarchar(max) NULL,
        [OldValues] nvarchar(max) NULL,
        [NewValues] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [ClubSettings] (
        [Id] uniqueidentifier NOT NULL,
        [Key] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NOT NULL,
        [ValueType] int NOT NULL,
        [Description] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ClubSettings] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [ClubTenants] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(160) NOT NULL,
        [Slug] nvarchar(80) NOT NULL,
        [ContactEmail] nvarchar(max) NOT NULL,
        [ContactPhone] nvarchar(max) NULL,
        [LogoUrl] nvarchar(max) NULL,
        [PrimaryColor] nvarchar(max) NOT NULL,
        [SecondaryColor] nvarchar(max) NOT NULL,
        [Address] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ClubTenants] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [AppUsers] (
        [Id] uniqueidentifier NOT NULL,
        [ClubTenantIdNullable] uniqueidentifier NULL,
        [FirstName] nvarchar(max) NOT NULL,
        [LastName] nvarchar(max) NOT NULL,
        [Email] nvarchar(180) NOT NULL,
        [Phone] nvarchar(max) NULL,
        [PasswordHash] nvarchar(300) NOT NULL,
        [Role] int NOT NULL,
        [IsActive] bit NOT NULL,
        [LastLoginAt] datetime2 NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_AppUsers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AppUsers_ClubTenants_ClubTenantId] FOREIGN KEY ([ClubTenantId]) REFERENCES [ClubTenants] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [Courts] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [SurfaceType] int NOT NULL,
        [IndoorOutdoor] int NOT NULL,
        [HasLights] bit NOT NULL,
        [IsActive] bit NOT NULL,
        [OpeningTime] time NOT NULL,
        [ClosingTime] time NOT NULL,
        [SlotDurationMinutes] int NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Courts] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Courts_ClubTenants_ClubTenantId] FOREIGN KEY ([ClubTenantId]) REFERENCES [ClubTenants] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [CoachProfiles] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Bio] nvarchar(max) NULL,
        [Specialty] nvarchar(max) NULL,
        [IsActive] bit NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_CoachProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CoachProfiles_AppUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AppUsers] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [MemberProfiles] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [MemberNumber] nvarchar(450) NOT NULL,
        [DocumentNumber] nvarchar(max) NULL,
        [BirthDate] date NULL,
        [EmergencyContactName] nvarchar(max) NULL,
        [EmergencyContactPhone] nvarchar(max) NULL,
        [MembershipStatus] int NOT NULL,
        [JoinedAt] datetime2 NOT NULL,
        [Notes] nvarchar(max) NULL,
        [NoShowCount] int NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_MemberProfiles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MemberProfiles_AppUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AppUsers] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [Notifications] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [Title] nvarchar(max) NOT NULL,
        [Message] nvarchar(max) NOT NULL,
        [Type] int NOT NULL,
        [IsRead] bit NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notifications_AppUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AppUsers] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(max) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ReplacedByTokenHash] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_AppUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AppUsers] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [CourtAvailabilities] (
        [Id] uniqueidentifier NOT NULL,
        [CourtId] uniqueidentifier NOT NULL,
        [DayOfWeek] int NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [IsAvailable] bit NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_CourtAvailabilities] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CourtAvailabilities_Courts_CourtId] FOREIGN KEY ([CourtId]) REFERENCES [Courts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [TrainingClasses] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(max) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CoachId] uniqueidentifier NOT NULL,
        [CourtId] uniqueidentifier NULL,
        [DayOfWeek] int NOT NULL,
        [StartTime] time NOT NULL,
        [EndTime] time NOT NULL,
        [MaxStudents] int NOT NULL,
        [Level] int NOT NULL,
        [IsActive] bit NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_TrainingClasses] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TrainingClasses_CoachProfiles_CoachId] FOREIGN KEY ([CoachId]) REFERENCES [CoachProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_TrainingClasses_Courts_CourtId] FOREIGN KEY ([CourtId]) REFERENCES [Courts] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [Memberships] (
        [Id] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NOT NULL,
        [Month] int NOT NULL,
        [Year] int NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Status] int NOT NULL,
        [DueFromDay] int NOT NULL,
        [DueToDay] int NOT NULL,
        [PaidAt] datetime2 NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Memberships] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Memberships_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [Reservations] (
        [Id] uniqueidentifier NOT NULL,
        [CourtId] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NULL,
        [StartDateTime] datetime2 NOT NULL,
        [EndDateTime] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [ReservationType] int NOT NULL,
        [CancelledAt] datetime2 NULL,
        [CancellationReason] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Reservations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Reservations_Courts_CourtId] FOREIGN KEY ([CourtId]) REFERENCES [Courts] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Reservations_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [ClassEnrollments] (
        [Id] uniqueidentifier NOT NULL,
        [TrainingClassId] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NOT NULL,
        [Status] int NOT NULL,
        [EnrolledAt] datetime2 NOT NULL,
        [CancelledAt] datetime2 NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ClassEnrollments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ClassEnrollments_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ClassEnrollments_TrainingClasses_TrainingClassId] FOREIGN KEY ([TrainingClassId]) REFERENCES [TrainingClasses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [ClassSessions] (
        [Id] uniqueidentifier NOT NULL,
        [TrainingClassId] uniqueidentifier NOT NULL,
        [SessionDate] date NOT NULL,
        [StartDateTime] datetime2 NOT NULL,
        [EndDateTime] datetime2 NOT NULL,
        [Status] int NOT NULL,
        [Notes] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ClassSessions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ClassSessions_TrainingClasses_TrainingClassId] FOREIGN KEY ([TrainingClassId]) REFERENCES [TrainingClasses] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NOT NULL,
        [MembershipId] uniqueidentifier NULL,
        [Amount] decimal(18,2) NOT NULL,
        [PaymentDate] datetime2 NOT NULL,
        [PaymentMethod] int NOT NULL,
        [Status] int NOT NULL,
        [Reference] nvarchar(max) NULL,
        [Notes] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Payments_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Payments_Memberships_MembershipId] FOREIGN KEY ([MembershipId]) REFERENCES [Memberships] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE TABLE [ClassAttendances] (
        [Id] uniqueidentifier NOT NULL,
        [ClassSessionId] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NOT NULL,
        [AttendanceStatus] int NOT NULL,
        [Notes] nvarchar(max) NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ClassAttendances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ClassAttendances_ClassSessions_ClassSessionId] FOREIGN KEY ([ClassSessionId]) REFERENCES [ClassSessions] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ClassAttendances_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_AppUsers_ClubTenantId] ON [AppUsers] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AppUsers_ClubTenantId_Email] ON [AppUsers] ([ClubTenantId], [Email]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_ClubTenantId] ON [AuditLogs] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassAttendances_ClassSessionId] ON [ClassAttendances] ([ClassSessionId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassAttendances_ClubTenantId] ON [ClassAttendances] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassAttendances_MemberProfileId] ON [ClassAttendances] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassEnrollments_ClubTenantId] ON [ClassEnrollments] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ClassEnrollments_ClubTenantId_TrainingClassId_MemberProfileId] ON [ClassEnrollments] ([ClubTenantId], [TrainingClassId], [MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassEnrollments_MemberProfileId] ON [ClassEnrollments] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassEnrollments_TrainingClassId] ON [ClassEnrollments] ([TrainingClassId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassSessions_ClubTenantId] ON [ClassSessions] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClassSessions_TrainingClassId] ON [ClassSessions] ([TrainingClassId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_ClubSettings_ClubTenantId] ON [ClubSettings] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ClubSettings_ClubTenantId_Key] ON [ClubSettings] ([ClubTenantId], [Key]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ClubTenants_Slug] ON [ClubTenants] ([Slug]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_CoachProfiles_ClubTenantId] ON [CoachProfiles] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CoachProfiles_UserId] ON [CoachProfiles] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_CourtAvailabilities_ClubTenantId] ON [CourtAvailabilities] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_CourtAvailabilities_CourtId] ON [CourtAvailabilities] ([CourtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Courts_ClubTenantId] ON [Courts] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_MemberProfiles_ClubTenantId] ON [MemberProfiles] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MemberProfiles_ClubTenantId_MemberNumber] ON [MemberProfiles] ([ClubTenantId], [MemberNumber]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MemberProfiles_UserId] ON [MemberProfiles] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Memberships_ClubTenantId] ON [Memberships] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Memberships_MemberProfileId] ON [Memberships] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Notifications_ClubTenantId] ON [Notifications] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Payments_ClubTenantId] ON [Payments] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Payments_MemberProfileId] ON [Payments] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Payments_MembershipId] ON [Payments] ([MembershipId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_ClubTenantId] ON [RefreshTokens] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Reservations_ClubTenantId] ON [Reservations] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Reservations_ClubTenantId_CourtId_StartDateTime_EndDateTime] ON [Reservations] ([ClubTenantId], [CourtId], [StartDateTime], [EndDateTime]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Reservations_CourtId] ON [Reservations] ([CourtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_Reservations_MemberProfileId] ON [Reservations] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_TrainingClasses_ClubTenantId] ON [TrainingClasses] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_TrainingClasses_CoachId] ON [TrainingClasses] ([CoachId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    CREATE INDEX [IX_TrainingClasses_CourtId] ON [TrainingClasses] ([CourtId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501050359_InitialCreateEf'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501050359_InitialCreateEf', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    ALTER TABLE [Reservations] ADD [PlayFormat] int NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    CREATE TABLE [ReservationParticipants] (
        [Id] uniqueidentifier NOT NULL,
        [ReservationId] uniqueidentifier NOT NULL,
        [MemberProfileId] uniqueidentifier NULL,
        [IsClubMember] bit NOT NULL,
        [FullName] nvarchar(180) NOT NULL,
        [Position] int NOT NULL,
        [ClubTenantId] uniqueidentifier NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [IsDeleted] bit NOT NULL,
        CONSTRAINT [PK_ReservationParticipants] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ReservationParticipants_MemberProfiles_MemberProfileId] FOREIGN KEY ([MemberProfileId]) REFERENCES [MemberProfiles] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ReservationParticipants_Reservations_ReservationId] FOREIGN KEY ([ReservationId]) REFERENCES [Reservations] ([Id]) ON DELETE NO ACTION
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    CREATE INDEX [IX_ReservationParticipants_ClubTenantId] ON [ReservationParticipants] ([ClubTenantId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    CREATE UNIQUE INDEX [IX_ReservationParticipants_ClubTenantId_ReservationId_Position] ON [ReservationParticipants] ([ClubTenantId], [ReservationId], [Position]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    CREATE INDEX [IX_ReservationParticipants_MemberProfileId] ON [ReservationParticipants] ([MemberProfileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    CREATE INDEX [IX_ReservationParticipants_ReservationId] ON [ReservationParticipants] ([ReservationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501062133_ReservationPlayersAndLimits'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501062133_ReservationPlayersAndLimits', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501063132_GuestPlayerFee'
)
BEGIN
    ALTER TABLE [Reservations] ADD [GuestFeePaidAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501063132_GuestPlayerFee'
)
BEGIN
    ALTER TABLE [Reservations] ADD [GuestFeePerPlayer] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501063132_GuestPlayerFee'
)
BEGIN
    ALTER TABLE [Reservations] ADD [GuestFeeTotal] decimal(18,2) NOT NULL DEFAULT 0.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501063132_GuestPlayerFee'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501063132_GuestPlayerFee', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    DECLARE @var0 sysname;
    SELECT @var0 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Payments]') AND [c].[name] = N'MemberProfileId');
    IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Payments] DROP CONSTRAINT [' + @var0 + '];');
    ALTER TABLE [Payments] ALTER COLUMN [MemberProfileId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    ALTER TABLE [Payments] ADD [Purpose] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    ALTER TABLE [Payments] ADD [ReservationId] uniqueidentifier NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    CREATE INDEX [IX_Payments_ClubTenantId_Purpose_PaymentDate] ON [Payments] ([ClubTenantId], [Purpose], [PaymentDate]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    CREATE INDEX [IX_Payments_ReservationId] ON [Payments] ([ReservationId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    ALTER TABLE [Payments] ADD CONSTRAINT [FK_Payments_Reservations_ReservationId] FOREIGN KEY ([ReservationId]) REFERENCES [Reservations] ([Id]) ON DELETE NO ACTION;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501070617_PaymentPurposeAndReservationLink'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501070617_PaymentPurposeAndReservationLink', N'8.0.10');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [BillingCurrency] nvarchar(8) NOT NULL DEFAULT N'UYU';
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [BillingNotes] nvarchar(max) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [BillingStatus] int NOT NULL DEFAULT 1;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [MaxCoaches] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [MaxCourts] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [MaxMembers] int NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [MonthlyPrice] decimal(18,2) NOT NULL DEFAULT 5990.0;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [PlanType] int NOT NULL DEFAULT 2;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [SubscriptionEndsAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [SubscriptionStartedAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    ALTER TABLE [ClubTenants] ADD [TrialEndsAt] datetime2 NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260501091044_TenantSaaSPlans'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260501091044_TenantSaaSPlans', N'8.0.10');
END;
GO

COMMIT;
GO

