import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug } = body;

    const existingTag = await prisma.tag.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingTag.slug) {
      const slugExists = await prisma.tag.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "A tag with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name ?? existingTag.name,
        slug: slug ?? existingTag.slug,
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const tagId = parseInt(id, 10);

    const existingTag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
