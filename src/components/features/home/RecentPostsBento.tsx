"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Calendar, ArrowUpRight } from "lucide-react";
import { MagicBentoContainer, BentoParticleCard } from "@/components/ui/MagicBento";
import { shouldBypassImageOptimization } from "@/lib/images";
import type { PostMeta } from "@/types/post";

interface RecentPostsBentoProps {
  posts: PostMeta[];
  emptyMessage: string;
}

export default function RecentPostsBento({ posts, emptyMessage }: RecentPostsBentoProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-(--border-color) bg-background/60 px-5 py-16 text-center text-sm text-foreground/55">
        {emptyMessage}
      </div>
    );
  }

  const [leadPost, ...morePosts] = posts.slice(0, 4);

  return (
    <MagicBentoContainer glowColor="132, 0, 255" enableSpotlight>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Lead Prominent Bento Card */}
        {leadPost && (
          <BentoParticleCard
            key={leadPost.slug}
            className="group relative flex flex-col justify-between rounded-2xl border border-(--border-color) bg-(--post-card)/90 backdrop-blur-xs p-5 md:p-6 md:col-span-2 transition-all hover:border-accent/60 hover:shadow-xl"
            enableTilt
            enableMagnetism
            clickEffect
            particleCount={10}
          >
            <Link href={`/post/${leadPost.slug}`} className="flex flex-col h-full justify-between gap-5">
              <div>
                {/* Header: Category & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {leadPost.category && (
                      <span className="inline-flex items-center gap-1 rounded-[6px] border border-accent/30 bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-accent">
                        {leadPost.categoryIcon && (
                          <span aria-hidden="true" className="text-xs">{leadPost.categoryIcon}</span>
                        )}
                        {leadPost.categoryName || leadPost.category}
                      </span>
                    )}
                  </div>
                  {leadPost.date && (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-foreground/50">
                      <Calendar className="h-3 w-3" />
                      {leadPost.date}
                    </span>
                  )}
                </div>

                {/* Cover Image Banner */}
                {leadPost.image && (
                  <div className="relative mb-4 h-48 sm:h-60 w-full overflow-hidden rounded-xl bg-background-hover">
                    <Image
                      src={leadPost.image}
                      alt={leadPost.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized={shouldBypassImageOptimization(leadPost.image)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />
                  </div>
                )}

                {/* Title & Description */}
                <h3 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                  {leadPost.title}
                </h3>
                {leadPost.description && (
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-foreground/65 line-clamp-3">
                    {leadPost.description}
                  </p>
                )}
              </div>

              {/* Footer: Reading Time & Action */}
              <div className="flex items-center justify-between pt-3 border-t border-(--border-color)/50 text-xs text-foreground/55">
                {leadPost.readingTime ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-accent" />
                    {leadPost.readingTime} min
                  </span>
                ) : <span />}
                <span className="inline-flex items-center gap-1 font-medium text-accent opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">
                  <span>Đọc tiếp</span>
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </BentoParticleCard>
        )}

        {/* Supporting Bento Cards */}
        {morePosts.map((post) => (
          <BentoParticleCard
            key={post.slug}
            className="group relative flex flex-col justify-between rounded-2xl border border-(--border-color) bg-(--post-card)/90 backdrop-blur-xs p-5 transition-all hover:border-accent/60 hover:shadow-lg"
            enableTilt
            enableMagnetism
            clickEffect
            particleCount={6}
          >
            <Link href={`/post/${post.slug}`} className="flex flex-col h-full justify-between gap-4">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  {post.category && (
                    <span className="inline-flex items-center gap-1 rounded-[5px] border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                      {post.categoryIcon && (
                        <span aria-hidden="true" className="text-[11px]">{post.categoryIcon}</span>
                      )}
                      {post.categoryName || post.category}
                    </span>
                  )}
                  {post.date && (
                    <span className="text-[11px] font-mono text-foreground/50">
                      {post.date}
                    </span>
                  )}
                </div>

                {/* Thumbnail Image */}
                {post.image && (
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-lg bg-background-hover">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 350px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized={shouldBypassImageOptimization(post.image)}
                    />
                  </div>
                )}

                {/* Title & Description */}
                <h4 className="text-sm sm:text-base font-semibold leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h4>
                {post.description && (
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground/60 line-clamp-2">
                    {post.description}
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2.5 border-t border-(--border-color)/50 text-xs text-foreground/50">
                {post.readingTime ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3 text-accent" />
                    {post.readingTime} min
                  </span>
                ) : <span />}
                <ArrowUpRight className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          </BentoParticleCard>
        ))}
      </div>
    </MagicBentoContainer>
  );
}

