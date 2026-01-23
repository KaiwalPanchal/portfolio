import Image from "next/image"
import { AlertTriangle } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { getAllPosts } from "@/lib/blog"

export const metadata: Metadata = {
    title: "Blog | My Portfolio",
    description: "A blog example page",
}

export default function BlogPage() {
    const posts = getAllPosts()
    const featuredPost = posts[0]
    const otherPosts = posts.slice(1)

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-orange-500/30">
            <main className="max-w-7xl mx-auto px-6 py-12 md:py-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-12">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">Kaiwal's Blog.</h1>
                </div>

                {/* Hero Image */}
                <div className="relative w-full h-[300px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-xl bg-neutral-900 shadow-sm ring-1 ring-white/10">
                    <Image
                        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=3540&ixlib=rb-4.0.3"
                        alt="Misty mountains landscape"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Featured Post */}
                {featuredPost && (
                    <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-12 items-start mb-24">
                        <div>
                            <Link href={`/blog/${featuredPost.slug}`} className="hover:underline decoration-orange-500 decoration-2 underline-offset-4">
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.1]">{featuredPost.title}</h2>
                            </Link>
                            <p className="text-neutral-400 text-sm font-medium">{featuredPost.date}</p>
                        </div>

                        <div className="space-y-8">
                            <p className="text-xl text-neutral-300 leading-relaxed font-normal">
                                {featuredPost.description}
                            </p>

                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-neutral-800">
                                    <Image
                                        src={featuredPost.author.image}
                                        alt={featuredPost.author.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <span className="font-bold text-white text-base">{featuredPost.author.name}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Latest Articles Grid */}
                {otherPosts.length > 0 && (
                    <div className="border-t border-neutral-800 pt-16">
                        <h3 className="text-2xl font-bold text-white mb-8">Latest Articles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
                            {otherPosts.map((post) => (
                                <Link href={`/blog/${post.slug}`} key={post.slug} className="group cursor-pointer">
                                    <article>
                                        <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg bg-neutral-900 mb-6 ring-1 ring-white/10">
                                            <Image
                                                src={post.image}
                                                alt={post.title}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-neutral-500">{post.date}</span>
                                                <span className="text-xs font-semibold px-2 py-1 bg-neutral-900 ring-1 ring-white/10 rounded-full text-neutral-400">{post.category}</span>
                                            </div>
                                            <h4 className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors leading-tight">
                                                {post.title}
                                            </h4>
                                            <p className="text-neutral-400 line-clamp-2">
                                                {post.description}
                                            </p>
                                            <div className="flex items-center gap-2 pt-2">
                                                <div className="relative w-6 h-6 rounded-full overflow-hidden bg-neutral-800">
                                                    <Image
                                                        src={post.author.image}
                                                        alt={post.author.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-neutral-200">{post.author.name}</span>
                                            </div>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
