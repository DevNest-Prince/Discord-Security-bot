import {
  type Guild,
  ChannelType,
  PermissionsBitField,
} from "discord.js";
import {
  createBackup,
  getBackup,
  type BackupRole,
  type BackupCategory,
  type BackupChannel,
} from "@aegisx/database";
import { randomBytes } from "crypto";

export async function createServerBackup(guild: Guild, creatorId: string): Promise<string> {
  const backupId = randomBytes(4).toString("hex").toUpperCase();

  const roles: BackupRole[] = [];
  guild.roles.cache
    .filter((r) => !r.managed && r.id !== guild.id)
    .sort((a, b) => b.position - a.position)
    .forEach((r) => {
      roles.push({
        id: r.id,
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        position: r.position,
        permissions: r.permissions.bitfield.toString(),
        mentionable: r.mentionable,
      });
    });

  const categories: BackupCategory[] = [];
  guild.channels.cache
    .filter((c) => c.type === ChannelType.GuildCategory)
    .forEach((c) => {
      categories.push({
        name: c.name,
        position: c.position,
        permissionOverwrites: c.permissionOverwrites.cache.map((ow: any) => ({
          id: ow.id,
          type: ow.type,
          allow: ow.allow.bitfield.toString(),
          deny: ow.deny.bitfield.toString(),
        })),
      });
    });


  const channels: BackupChannel[] = [];
  guild.channels.cache
    .filter((c) => c.type !== ChannelType.GuildCategory && !c.isThread())
    .forEach((c: any) => {
      channels.push({
        name: c.name,
        type: c.type,
        topic: "topic" in c ? (c.topic as string) : null,
        parent: c.parent ? c.parent.name : null,
        position: c.position ?? 0,
        permissionOverwrites: c.permissionOverwrites?.cache
          ? c.permissionOverwrites.cache.map((ow: any) => ({
              id: ow.id,
              type: ow.type,
              allow: ow.allow.bitfield.toString(),
              deny: ow.deny.bitfield.toString(),
            }))
          : [],
      });
    });


  await createBackup({
    backupId,
    guildId: guild.id,
    creatorId,
    name: guild.name,
    iconUrl: guild.iconURL(),
    roles,
    categories,
    channels,
  });

  return backupId;
}

export async function loadServerBackup(guild: Guild, backupId: string): Promise<{ success: boolean; error?: string }> {
  const backup = await getBackup(backupId);
  if (!backup) return { success: false, error: "Backup not found" };

  try {
    // 1. Delete non-managed roles
    const currentRoles = guild.roles.cache.filter((r) => !r.managed && r.id !== guild.id);
    for (const [, r] of currentRoles) {
      await r.delete().catch(() => {});
    }

    // 2. Re-create roles
    const createdRoleMap = new Map<string, string>(); // oldId -> newId
    for (const rData of backup.roles) {
      try {
        const newRole = await guild.roles.create({
          name: rData.name,
          color: rData.color,
          hoist: rData.hoist,
          permissions: new PermissionsBitField(BigInt(rData.permissions)),
          mentionable: rData.mentionable,
        });
        createdRoleMap.set(rData.id, newRole.id);
      } catch {}
    }

    // 3. Delete existing channels
    const currentChannels = guild.channels.cache;
    for (const [, c] of currentChannels) {
      await c.delete().catch(() => {});
    }

    // 4. Re-create categories
    const categoryMap = new Map<string, any>();
    for (const catData of backup.categories) {
      try {
        const cat = await guild.channels.create({
          name: catData.name,
          type: ChannelType.GuildCategory,
          position: catData.position,
        });
        categoryMap.set(catData.name, cat);
      } catch {}
    }

    // 5. Re-create channels
    for (const chData of backup.channels) {
      try {
        const parentCategory = chData.parent ? categoryMap.get(chData.parent) : undefined;
        await guild.channels.create({
          name: chData.name,
          type: chData.type,
          topic: chData.topic || undefined,
          parent: parentCategory ? parentCategory.id : undefined,
          position: chData.position,
        });
      } catch {}
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
