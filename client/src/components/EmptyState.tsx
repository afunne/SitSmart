import type { ReactNode } from 'react'
import { Flex, Heading, Text } from '@radix-ui/themes'

interface EmptyStateProps {
  /** Pixel-art picture from /public, 48×48 (shown at 96 px). */
  image: string
  title: string
  text?: string
  /** E.g. a button that leads somewhere useful. */
  action?: ReactNode
}

/** Centered picture, title and text for a list that has nothing in it yet. */
export default function EmptyState({ image, title, text, action }: EmptyStateProps) {
  return (
    <Flex direction="column" align="center" gap="3" py="8" style={{ textAlign: 'center' }}>
      <img src={image} alt="" width={96} height={96} className="pixelated" />
      <Heading as="h2" size="5">{title}</Heading>
      {text && <Text as="p" color="gray" style={{ maxWidth: '40ch' }}>{text}</Text>}
      {action && <Flex mt="2">{action}</Flex>}
    </Flex>
  )
}
