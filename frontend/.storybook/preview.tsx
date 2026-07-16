import type { Preview } from '@storybook/react'
import React from 'react'
import { MotionProvider } from '../src/contexts/MotionContext'
import '../src/index.scss'

const preview: Preview = {
  decorators: [
    (Story) => (
      <MotionProvider>
        <Story />
      </MotionProvider>
    ),
  ],
  parameters: {
    a11y: { test: 'error' },
    backgrounds: { default: 'world', values: [{ name: 'world', value: '#070A18' }] },
  },
}
export default preview
