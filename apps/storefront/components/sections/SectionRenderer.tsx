import { HeroBanner } from './HeroBanner'
import { CategoryGrid } from './CategoryGrid'
import { FeaturedProducts } from './FeaturedProducts'
import { PromoBar } from './PromoBar'
import { Testimonials } from './Testimonials'
import { FAQSection } from './FAQSection'
import { FeatureBlocks } from './FeatureBlocks'

interface SectionRendererProps {
  sections: any[]
}

export function SectionRenderer({ sections }: SectionRendererProps) {
  if (!sections?.length) return null

  return (
    <>
      {sections.map((section, i) => {
        switch (section.blockType) {
          case 'heroBanner':
            return <HeroBanner key={i} block={section} />
          case 'categoryGrid':
            return <CategoryGrid key={i} block={section} />
          case 'featuredProducts':
            return <FeaturedProducts key={i} block={section} />
          case 'promoBar':
            return <PromoBar key={i} block={section} />
          case 'testimonials':
            return <Testimonials key={i} block={section} />
          case 'faqSection':
            return <FAQSection key={i} block={section} />
          case 'featureBlocks':
            return <FeatureBlocks key={i} block={section} />
          default:
            return null
        }
      })}
    </>
  )
}
