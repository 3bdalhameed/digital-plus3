interface PromoBarProps {
  block: {
    text: string
    couponCode?: string
    enabled: boolean
  }
}

export function PromoBar({ block }: PromoBarProps) {
  if (!block.enabled) return null

  return (
    <div className="bg-primary-dark text-white py-2 px-4 text-center text-sm font-medium">
      {block.text}
      {block.couponCode && (
        <span className="mr-2 bg-white text-primary px-2 py-0.5 rounded font-mono font-bold">
          {block.couponCode}
        </span>
      )}
    </div>
  )
}
