import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Folder, Tag, MessageSquare } from "lucide-react";

export default async function AdminDashboard() {
  const [postCount, categoryCount, tagCount, commentCount] = await Promise.all([
    prisma.post.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.comment.count(),
  ]);

  const stats = [
    {
      title: "文章总数",
      value: postCount,
      icon: FileText,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "分类数",
      value: categoryCount,
      icon: Folder,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "标签数",
      value: tagCount,
      icon: Tag,
      iconColor: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      title: "评论数",
      value: commentCount,
      icon: MessageSquare,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">仪表盘</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bgColor}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
