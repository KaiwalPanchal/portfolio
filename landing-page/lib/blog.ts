
import fs from "fs"
import path from "path"
import matter from "gray-matter"

const postsDirectory = path.join(process.cwd(), "content/posts")

export type Post = {
    slug: string
    title: string
    date: string
    description: string
    image: string
    author: {
        name: string
        image: string
    }
    category?: string
    content: string
}

export function getAllPosts(): Post[] {
    // Ensure directory exists
    if (!fs.existsSync(postsDirectory)) {
        return []
    }

    const fileNames = fs.readdirSync(postsDirectory)
    const allPostsData = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
        const slug = fileName.replace(/\.md$/, "")

        // Read markdown file as string
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, "utf8")

        // Use gray-matter to parse the post metadata section
        const { data, content } = matter(fileContents)

        return {
            slug,
            content,
            ...(data as any),
        } as Post
    })

    // Sort posts by date
    return allPostsData.sort((a, b) => {
        if (a.date < b.date) {
            return 1
        } else {
            return -1
        }
    })
}

export function getLatestPosts(count: number = 4): Post[] {
    return getAllPosts().slice(0, count)
}

export function getPostBySlug(slug: string): Post | null {
    try {
        const fullPath = path.join(postsDirectory, `${slug}.md`)
        const fileContents = fs.readFileSync(fullPath, "utf8")

        // Use gray-matter to parse the post metadata section
        const { data, content } = matter(fileContents)

        return {
            slug,
            content,
            ...(data as any),
        } as Post
    } catch (e) {
        return null
    }
}
