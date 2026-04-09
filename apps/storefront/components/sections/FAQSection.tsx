'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQSectionProps {
  block: {
    items: { question: string; answer: string }[]
    enabled: boolean
  }
}

export function FAQSection({ block }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (!block.enabled || !block.items?.length) return null

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-black text-primary-dark mb-10 text-center">
        الأسئلة الشائعة
      </h2>
      <div className="space-y-3">
        {block.items.map((item, i) => (
          <div key={i} className="card-purple overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-right hover:bg-purple-50 transition-colors"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span className="font-bold text-primary-dark">{item.question}</span>
              <ChevronDown
                className={`h-5 w-5 text-primary shrink-0 mr-2 transition-transform duration-200 ${
                  openIndex === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-purple-100 pt-4">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
