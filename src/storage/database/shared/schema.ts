import { pgTable, serial, timestamp, index, foreignKey, varchar, integer, boolean, text, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ==================== 用户系统相关表 ====================

// 用户资料表（扩展 Supabase Auth users）
export const profiles = pgTable("profiles", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull().unique(), // Supabase Auth user id
	email: varchar({ length: 255 }),
	name: varchar({ length: 255 }),
	avatar: varchar({ length: 500 }),
	// 订阅信息
	subscriptionTier: varchar("subscription_tier", { length: 20 }).default('free').notNull(), // free, pro, enterprise
	subscriptionStatus: varchar("subscription_status", { length: 20 }).default('active').notNull(), // active, canceled, expired
	subscriptionStartAt: timestamp("subscription_start_at", { withTimezone: true, mode: 'string' }),
	subscriptionEndAt: timestamp("subscription_end_at", { withTimezone: true, mode: 'string' }),
	// 使用量统计
	projectsCount: integer("projects_count").default(0).notNull(),
	scenesCount: integer("scenes_count").default(0).notNull(),
	exportsCount: integer("exports_count").default(0).notNull(),
	// 时间戳
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("profiles_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("profiles_subscription_tier_idx").using("btree", table.subscriptionTier.asc().nullsLast().op("text_ops")),
]);

// 编辑器项目表
export const projects = pgTable("projects", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	coverImage: varchar("cover_image", { length: 500 }),
	// 项目数据（JSON格式存储完整的编辑器状态）
	projectData: jsonb("project_data").notNull(),
	// 分类
	category: varchar({ length: 50 }).default('other').notNull(), // romance, suspense, scifi, fantasy, horror, comedy, other
	tags: jsonb().default([]),
	// 分享设置
	isPublic: boolean("is_public").default(false).notNull(),
	shareCode: varchar("share_code", { length: 20 }), // 分享码，用于公开访问
	// 统计
	viewCount: integer("view_count").default(0).notNull(),
	likeCount: integer("like_count").default(0).notNull(),
	// 时间戳
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("projects_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("projects_share_code_idx").using("btree", table.shareCode.asc().nullsLast().op("text_ops")),
	index("projects_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("projects_is_public_idx").using("btree", table.isPublic.asc().nullsLast().op("bool_ops")),
	index("projects_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

// 项目点赞记录表
export const projectLikes = pgTable("project_likes", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	projectId: varchar("project_id", { length: 36 }).notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(), // 用户ID或访客标识
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("project_likes_project_id_idx").using("btree", table.projectId.asc().nullsLast().op("text_ops")),
	index("project_likes_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
		columns: [table.projectId],
		foreignColumns: [projects.id],
		name: "project_likes_project_id_projects_id_fk"
	}).onDelete("cascade"),
]);

// 订阅记录表
export const subscriptions = pgTable("subscriptions", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	// 订阅信息
	tier: varchar({ length: 20 }).notNull(), // pro, enterprise
	status: varchar({ length: 20 }).default('active').notNull(), // active, canceled, expired
	// 支付信息
	paymentProvider: varchar("payment_provider", { length: 20 }), // wechat, alipay
	paymentId: varchar("payment_id", { length: 255 }), // 支付平台订单号
	amount: integer().notNull(), // 金额（分）
	currency: varchar({ length: 10 }).default('CNY').notNull(),
	// 周期
	interval: varchar({ length: 20 }).default('monthly').notNull(), // monthly, yearly
	// 时间
	startAt: timestamp("start_at", { withTimezone: true, mode: 'string' }).notNull(),
	endAt: timestamp("end_at", { withTimezone: true, mode: 'string' }).notNull(),
	canceledAt: timestamp("canceled_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("subscriptions_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("subscriptions_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

// 模板表
export const templates = pgTable("templates", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	coverImage: varchar("cover_image", { length: 500 }),
	category: varchar({ length: 50 }).notNull(), // 短剧, 营销, 教育, 游戏
	tags: jsonb().default([]),
	projectData: jsonb("project_data").notNull(),
	// 是否官方模板
	isOfficial: boolean("is_official").default(false).notNull(),
	// 是否付费
	isPremium: boolean("is_premium").default(false).notNull(),
	price: integer().default(0),
	// 统计
	useCount: integer("use_count").default(0).notNull(),
	likeCount: integer("like_count").default(0).notNull(),
	// 作者
	authorId: varchar("author_id", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("templates_category_idx").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("templates_is_official_idx").using("btree", table.isOfficial.asc().nullsLast().op("bool_ops")),
]);

// ==================== 原有表 ====================



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const sceneItems = pgTable("scene_items", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	sceneId: varchar("scene_id", { length: 36 }).notNull(),
	itemId: varchar("item_id", { length: 36 }).notNull(),
	positionX: integer("position_x").default(0).notNull(),
	positionY: integer("position_y").default(0).notNull(),
	positionZ: integer("position_z").default(0).notNull(),
	isCollected: boolean("is_collected").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("scene_items_scene_id_idx").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "scene_items_scene_id_scenes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [items.id],
			name: "scene_items_item_id_items_id_fk"
		}).onDelete("cascade"),
]);

export const characters = pgTable("characters", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	avatar: varchar({ length: 500 }),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const items = pgTable("items", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	icon: varchar({ length: 500 }),
	description: text(),
	type: varchar({ length: 50 }).default('misc').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const scenes = pgTable("scenes", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	storyId: varchar("story_id", { length: 36 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	panoramaImage: varchar("panorama_image", { length: 500 }).notNull(),
	backgroundAudio: varchar("background_audio", { length: 500 }),
	initialRotation: integer("initial_rotation").default(0),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("scenes_story_id_idx").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "scenes_story_id_stories_id_fk"
		}).onDelete("cascade"),
]);

export const stories = pgTable("stories", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	coverImage: varchar("cover_image", { length: 500 }),
	isPublished: boolean("is_published").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("stories_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const storyNodes = pgTable("story_nodes", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	sceneId: varchar("scene_id", { length: 36 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	nodeType: varchar("node_type", { length: 20 }).default('dialogue').notNull(),
	characterId: varchar("character_id", { length: 36 }),
	positionX: integer("position_x").default(0),
	positionY: integer("position_y").default(0),
	positionZ: integer("position_z").default(0),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("story_nodes_scene_id_idx").using("btree", table.sceneId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sceneId],
			foreignColumns: [scenes.id],
			name: "story_nodes_scene_id_scenes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.characterId],
			foreignColumns: [characters.id],
			name: "story_nodes_character_id_characters_id_fk"
		}).onDelete("set null"),
]);

export const choices = pgTable("choices", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	nodeId: varchar("node_id", { length: 36 }).notNull(),
	choiceText: varchar("choice_text", { length: 500 }).notNull(),
	nextNodeId: varchar("next_node_id", { length: 36 }),
	condition: jsonb(),
	orderIndex: integer("order_index").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("choices_node_id_idx").using("btree", table.nodeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.nodeId],
			foreignColumns: [storyNodes.id],
			name: "choices_node_id_story_nodes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.nextNodeId],
			foreignColumns: [storyNodes.id],
			name: "choices_next_node_id_story_nodes_id_fk"
		}).onDelete("set null"),
]);

export const userProgress = pgTable("user_progress", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	storyId: varchar("story_id", { length: 36 }).notNull(),
	currentNodeId: varchar("current_node_id", { length: 36 }),
	choicesMade: jsonb("choices_made").default([]),
	itemsCollected: jsonb("items_collected").default([]),
	progress: integer().default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("user_progress_story_id_idx").using("btree", table.storyId.asc().nullsLast().op("text_ops")),
	index("user_progress_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.storyId],
			foreignColumns: [stories.id],
			name: "user_progress_story_id_stories_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.currentNodeId],
			foreignColumns: [storyNodes.id],
			name: "user_progress_current_node_id_story_nodes_id_fk"
		}).onDelete("set null"),
]);
