
import { getPostBySlug, getAllPosts } from "@/lib/blog"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

interface Props {
    params: {
        slug: string
    }
}

export async function generateStaticParams() {
    const posts = getAllPosts()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export default function BlogPost({ params }: Props) {
    const post = getPostBySlug(params.slug)

    if (!post) {
        return notFound()
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-orange-500/30">
            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Blog
                </Link>

                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-sm font-medium text-orange-500">{post.category}</span>
                        <span className="text-sm text-neutral-500">{post.date}</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
                        {post.title}
                    </h1>

                    <div className="flex items-center gap-3 border-b border-neutral-800 pb-8">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 ring-2 ring-neutral-800">
                            <Image
                                src={post.author.image}
                                alt={post.author.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <span className="font-bold text-white text-base">{post.author.name}</span>
                    </div>
                </header>

                <div className="relative w-full aspect-video overflow-hidden rounded-xl bg-neutral-900 shadow-sm ring-1 ring-white/10 mb-12">
                    <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover"
                    />
                </div>

                <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-orange-500 prose-img:rounded-xl">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                </article>
            </main>
        </div>
    )
}
