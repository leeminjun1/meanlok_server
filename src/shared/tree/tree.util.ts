import type { Prisma, PrismaClient } from '@prisma/client';

type TxClient = Prisma.TransactionClient | PrismaClient;

type CloneSubtreeOptions = {
  targetWorkspaceId: string;
  targetParentId?: string;
  authorId: string;
};

export async function collectDescendantIds(
  tx: TxClient,
  rootPageId: string,
): Promise<Set<string>> {
  const collected = new Set<string>([rootPageId]);
  const queue = [rootPageId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    if (!currentId) {
      continue;
    }

    const children = await tx.page.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });

    for (const child of children) {
      if (!collected.has(child.id)) {
        collected.add(child.id);
        queue.push(child.id);
      }
    }
  }

  return collected;
}

export async function cloneSubtree(
  tx: TxClient,
  rootPageId: string,
  options: CloneSubtreeOptions,
): Promise<string> {
  const clonePage = async (sourcePageId: string, parentId: string | null): Promise<string> => {
    const source = await tx.page.findUnique({
      where: { id: sourcePageId },
      include: {
        document: true,
        children: {
          orderBy: { order: 'asc' },
          select: { id: true },
        },
      },
    });

    if (!source) {
      throw new Error('Source page not found');
    }

    const created = await tx.page.create({
      data: {
        workspaceId: options.targetWorkspaceId,
        parentId,
        title: source.title,
        icon: source.icon,
        order: source.order,
        authorId: options.authorId,
      },
    });

    if (source.document) {
      await tx.document.create({
        data: {
          pageId: created.id,
          body: source.document.body,
          format: source.document.format,
        },
      });
    } else {
      await tx.document.create({
        data: {
          pageId: created.id,
        },
      });
    }

    for (const child of source.children) {
      await clonePage(child.id, created.id);
    }

    return created.id;
  };

  return clonePage(rootPageId, options.targetParentId ?? null);
}
