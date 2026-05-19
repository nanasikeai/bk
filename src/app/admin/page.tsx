import { prisma } from "@/lib/prisma";
import { getVisitStats } from "@/lib/visit-tracking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FileText,
  Folder,
  Tag,
  MessageSquare,
  Users,
  CalendarDays,
  CalendarRange,
} from "lucide-react";

export default async function AdminDashboard() {
  const [
    postCount,
    categoryCount,
    tagCount,
    commentCount,
    pendingCommentCount,
    visitStats,
  ] = await Promise.all([
    prisma.post.count(),
    prisma.category.count(),
    prisma.tag.count(),
    prisma.comment.count(),
    prisma.comment.count({ where: { status: "PENDING" } }),
    getVisitStats(),
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
      value:
        pendingCommentCount > 0
          ? `${commentCount} (${pendingCommentCount} 待审)`
          : commentCount,
      icon: MessageSquare,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  const visitorStats = [
    {
      title: "今日访客",
      value: visitStats.today,
      description: "按独立访客统计（Asia/Shanghai）",
      icon: Users,
      iconColor: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      title: "本周访客",
      value: visitStats.thisWeek,
      description: "周一至今日",
      icon: CalendarDays,
      iconColor: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      title: "本月访客",
      value: visitStats.thisMonth,
      description: "本月 1 号至今",
      icon: CalendarRange,
      iconColor: "text-rose-500",
      bgColor: "bg-rose-500/10",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">仪表盘</h1>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">访客统计</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visitorStats.map((stat) => (
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
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">本月访问来源（Top 10）</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {visitStats.topSources.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">暂无访问记录</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left">
                      <th className="px-6 py-3 font-medium">来源</th>
                      <th className="px-6 py-3 font-medium text-right">
                        独立访客
                      </th>
                      <th className="px-6 py-3 font-medium text-right">
                        访问次数
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitStats.topSources.map((row) => (
                      <tr key={row.source} className="border-b last:border-0">
                        <td className="px-6 py-3">{row.source}</td>
                        <td className="px-6 py-3 text-right tabular-nums">
                          {row.visitors}
                        </td>
                        <td className="px-6 py-3 text-right tabular-nums text-muted-foreground">
                          {row.visits}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">内容概览</h2>
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
      </section>
    </div>
  );
}
