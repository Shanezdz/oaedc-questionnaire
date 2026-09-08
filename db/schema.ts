import {sqliteTable,text} from "drizzle-orm/sqlite-core";
export const responses=sqliteTable("responses",{id:text("id").primaryKey(),createdAt:text("created_at").notNull(),answers:text("answers").notNull()});
