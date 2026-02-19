import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...post,
      tags: post.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, slug, content, excerpt, coverImage, published, categoryId, tagIds } = body;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.post.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update post with new data
    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingPost.title,
        slug: slug ?? existingPost.slug,
        content: content ?? existingPost.content,
        excerpt: excerpt ?? existingPost.excerpt,
        coverImage: coverImage ?? existingPost.coverImage,
        published: published ?? existingPost.published,
        categoryId: categoryId === null ? null : (categoryId ?? existingPost.categoryId),
      },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    // Update tags if provided
    if (tagIds !== undefined) {
      await prisma.postTag.deleteMany({
        where: { postId: post.id },
      });

      if (tagIds.length > 0) {
        await prisma.postTag.createMany({
          data: tagIds.map((tagId: number) => ({
            postId: post.id,
            tagId,
          })),
        });
      }
    }

    // Refetch with updated tags
    const updatedPost = await prisma.post.findUnique({
      where: { id: post.id },
      include: {
        category: true,
        tags: {
          include: { tag: true },
        },
      },
    });

    return NextResponse.json({
      ...updatedPost,
      tags: updatedPost?.tags.map((t) => t.tag),
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const postId = parseInt(id, 10);

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
