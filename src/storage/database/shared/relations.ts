import { relations } from "drizzle-orm/relations";
import { scenes, sceneItems, items, stories, storyNodes, characters, choices, userProgress } from "./schema";

export const sceneItemsRelations = relations(sceneItems, ({one}) => ({
	scene: one(scenes, {
		fields: [sceneItems.sceneId],
		references: [scenes.id]
	}),
	item: one(items, {
		fields: [sceneItems.itemId],
		references: [items.id]
	}),
}));

export const scenesRelations = relations(scenes, ({one, many}) => ({
	sceneItems: many(sceneItems),
	story: one(stories, {
		fields: [scenes.storyId],
		references: [stories.id]
	}),
	storyNodes: many(storyNodes),
}));

export const itemsRelations = relations(items, ({many}) => ({
	sceneItems: many(sceneItems),
}));

export const storiesRelations = relations(stories, ({many}) => ({
	scenes: many(scenes),
	userProgresses: many(userProgress),
}));

export const storyNodesRelations = relations(storyNodes, ({one, many}) => ({
	scene: one(scenes, {
		fields: [storyNodes.sceneId],
		references: [scenes.id]
	}),
	character: one(characters, {
		fields: [storyNodes.characterId],
		references: [characters.id]
	}),
	choices_nodeId: many(choices, {
		relationName: "choices_nodeId_storyNodes_id"
	}),
	choices_nextNodeId: many(choices, {
		relationName: "choices_nextNodeId_storyNodes_id"
	}),
	userProgresses: many(userProgress),
}));

export const charactersRelations = relations(characters, ({many}) => ({
	storyNodes: many(storyNodes),
}));

export const choicesRelations = relations(choices, ({one}) => ({
	storyNode_nodeId: one(storyNodes, {
		fields: [choices.nodeId],
		references: [storyNodes.id],
		relationName: "choices_nodeId_storyNodes_id"
	}),
	storyNode_nextNodeId: one(storyNodes, {
		fields: [choices.nextNodeId],
		references: [storyNodes.id],
		relationName: "choices_nextNodeId_storyNodes_id"
	}),
}));

export const userProgressRelations = relations(userProgress, ({one}) => ({
	story: one(stories, {
		fields: [userProgress.storyId],
		references: [stories.id]
	}),
	storyNode: one(storyNodes, {
		fields: [userProgress.currentNodeId],
		references: [storyNodes.id]
	}),
}));