import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const syncProviderEnum = pgEnum("sync_provider", [
  "pcloud",
  "google_drive",
]);

// ---- Auth tables (Better Auth) ----

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  timezone: text("timezone").default("browser").notNull(),
  timeFormat: text("time_format").default("browser").notNull(),
  role: text("role").default("user").notNull(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    sessionUserIdIdx: index("session_userId_idx").on(table.userId),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    accountUserIdIdx: index("account_userId_idx").on(table.userId),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    verificationIdentifierIdx: index("verification_identifier_idx").on(
      table.identifier
    ),
  })
);

// ---- Application tables ----

export const workspace = pgTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon").default("BookOpen").notNull(),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const workspaceMember = pgTable(
  "workspace_member",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: workspaceRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    memberWorkspaceIdx: index("member_workspace_idx").on(table.workspaceId),
    memberUserIdx: index("member_user_idx").on(table.userId),
  })
);

export const folder = pgTable(
  "folder",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    parentId: text("parent_id").references((): any => folder.id, {
      onDelete: "cascade",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    icon: text("icon").default("FolderPlus").notNull(),
    position: integer("position").default(0).notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    folderWorkspaceIdx: index("folder_workspace_idx").on(table.workspaceId),
    folderParentIdx: index("folder_parent_idx").on(table.parentId),
  })
);

export const note = pgTable(
  "note",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folder.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").default("").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
  },
  (table) => ({
    noteWorkspaceIdx: index("note_workspace_idx").on(table.workspaceId),
    noteFolderIdx: index("note_folder_idx").on(table.folderId),
    noteSearchIdx: index("note_search_idx").on(table.title),
  })
);

export const tag = pgTable(
  "tag",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").default("#88c0d0").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tagWorkspaceIdx: index("tag_workspace_idx").on(table.workspaceId),
  })
);

export const noteTag = pgTable(
  "note_tag",
  {
    noteId: text("note_id")
      .notNull()
      .references(() => note.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tag.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.noteId, table.tagId] }),
  })
);

export const syncConnection = pgTable("sync_connection", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: syncProviderEnum("provider").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  config: text("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const noteTemplate = pgTable(
  "note_template",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    content: text("content").default("").notNull(),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    templateWorkspaceIdx: index("template_workspace_idx").on(table.workspaceId),
  })
);

export const pluginConfig = pgTable(
  "plugin_config",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    pluginId: text("plugin_id").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    config: jsonb("config").default("{}").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    pluginWorkspaceIdx: index("plugin_workspace_idx").on(table.workspaceId),
    pluginIdIdx: index("plugin_id_idx").on(table.pluginId),
    uniqueWorkspacePlugin: uniqueIndex("unique_workspace_plugin").on(
      table.workspaceId,
      table.pluginId
    ),
  })
);

export const noteLink = pgTable("note_link", {
  id: text("id").primaryKey(),
  sourceNoteId: text("source_note_id")
    .notNull()
    .references(() => note.id, { onDelete: "cascade" }),
  targetNoteId: text("target_note_id")
    .notNull()
    .references(() => note.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const noteVersion = pgTable(
  "note_version",
  {
    id: text("id").primaryKey(),
    noteId: text("note_id")
      .notNull()
      .references(() => note.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    changeSummary: text("change_summary"),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    versionNoteIdx: index("version_note_idx").on(table.noteId),
  })
);

export const webhook = pgTable(
  "webhook",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    secret: text("secret"),
    events: jsonb("events").default("[]").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    webhookWorkspaceIdx: index("webhook_workspace_idx").on(table.workspaceId),
  })
);

// ---- Relations ----

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  memberships: many(workspaceMember),
  ownedWorkspaces: many(workspace, { relationName: "ownedWorkspaces" }),
  createdNotes: many(note, { relationName: "createdNotes" }),
  updatedNotes: many(note, { relationName: "updatedNotes" }),
  createdFolders: many(folder, { relationName: "createdFolders" }),
  createdTags: many(tag, { relationName: "createdTags" }),
  createdTemplates: many(noteTemplate, { relationName: "createdTemplates" }),
  syncConnections: many(syncConnection),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const workspaceRelations = relations(workspace, ({ many, one }) => ({
  members: many(workspaceMember),
  folders: many(folder),
  notes: many(note),
  tags: many(tag),
  templates: many(noteTemplate),
  pluginConfigs: many(pluginConfig),
  webhooks: many(webhook),
  owner: one(user, {
    fields: [workspace.createdById],
    references: [user.id],
    relationName: "ownedWorkspaces",
  }),
}));

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
  })
);

export const folderRelations = relations(folder, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [folder.workspaceId],
    references: [workspace.id],
  }),
  parent: one(folder, {
    fields: [folder.parentId],
    references: [folder.id],
    relationName: "children",
  }),
  children: many(folder, { relationName: "children" }),
  notes: many(note),
  creator: one(user, {
    fields: [folder.createdById],
    references: [user.id],
    relationName: "createdFolders",
  }),
}));

export const noteRelations = relations(note, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [note.workspaceId],
    references: [workspace.id],
  }),
  folder: one(folder, {
    fields: [note.folderId],
    references: [folder.id],
  }),
  creator: one(user, {
    fields: [note.createdById],
    references: [user.id],
    relationName: "createdNotes",
  }),
  updater: one(user, {
    fields: [note.updatedById],
    references: [user.id],
    relationName: "updatedNotes",
  }),
  noteTags: many(noteTag),
  outgoingLinks: many(noteLink, { relationName: "outgoingLinks" }),
  incomingLinks: many(noteLink, { relationName: "incomingLinks" }),
  versions: many(noteVersion),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [tag.workspaceId],
    references: [workspace.id],
  }),
  creator: one(user, {
    fields: [tag.createdById],
    references: [user.id],
    relationName: "createdTags",
  }),
  noteTags: many(noteTag),
}));

export const noteTagRelations = relations(noteTag, ({ one }) => ({
  note: one(note, {
    fields: [noteTag.noteId],
    references: [note.id],
  }),
  tag: one(tag, {
    fields: [noteTag.tagId],
    references: [tag.id],
  }),
}));

export const syncConnectionRelations = relations(syncConnection, ({ one }) => ({
  user: one(user, {
    fields: [syncConnection.userId],
    references: [user.id],
  }),
}));

export const noteTemplateRelations = relations(noteTemplate, ({ one }) => ({
  workspace: one(workspace, {
    fields: [noteTemplate.workspaceId],
    references: [workspace.id],
  }),
  creator: one(user, {
    fields: [noteTemplate.createdById],
    references: [user.id],
    relationName: "createdTemplates",
  }),
}));

export const noteLinkRelations = relations(noteLink, ({ one }) => ({
  source: one(note, {
    fields: [noteLink.sourceNoteId],
    references: [note.id],
    relationName: "outgoingLinks",
  }),
  target: one(note, {
    fields: [noteLink.targetNoteId],
    references: [note.id],
    relationName: "incomingLinks",
  }),
}));

export const noteVersionRelations = relations(noteVersion, ({ one }) => ({
  note: one(note, {
    fields: [noteVersion.noteId],
    references: [note.id],
  }),
  creator: one(user, {
    fields: [noteVersion.createdById],
    references: [user.id],
  }),
}));

export const pluginConfigRelations = relations(pluginConfig, ({ one }) => ({
  workspace: one(workspace, {
    fields: [pluginConfig.workspaceId],
    references: [workspace.id],
  }),
}));

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    details: text("details"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    auditUserIdIdx: index("audit_userId_idx").on(table.userId),
    auditActionIdx: index("audit_action_idx").on(table.action),
    auditCreatedAtIdx: index("audit_createdAt_idx").on(table.createdAt),
  })
);

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));

export const webhookRelations = relations(webhook, ({ one }) => ({
  workspace: one(workspace, {
    fields: [webhook.workspaceId],
    references: [workspace.id],
  }),
}));
