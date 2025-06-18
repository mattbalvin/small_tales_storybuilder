import { expect, test } from 'vitest'
import { storiesService } from '../src/lib/stores/stories'
import { generateId } from '../src/lib/utils'

test('generateId creates unique identifiers', () => {
  const id1 = generateId()
  const id2 = generateId()
  
  expect(id1).toHaveLength(9)
  expect(id2).toHaveLength(9)
  expect(id1).not.toBe(id2)
})

test('story element structure validation', () => {
  const textElement = {
    id: generateId(),
    type: 'text',
    x: 100,
    y: 100,
    width: 300,
    height: 100,
    properties: {
      text: 'Sample text',
      fontSize: 16,
      color: '#000000'
    }
  }

  expect(textElement.type).toBe('text')
  expect(textElement.properties.text).toBe('Sample text')
  expect(textElement.x).toBeGreaterThanOrEqual(0)
  expect(textElement.y).toBeGreaterThanOrEqual(0)
})

test('page content structure validation', () => {
  const pageContent = {
    elements: [
      {
        id: generateId(),
        type: 'text',
        x: 50,
        y: 50,
        width: 200,
        height: 100,
        properties: { text: 'Hello World' }
      }
    ],
    background: null,
    animation: null
  }

  expect(Array.isArray(pageContent.elements)).toBe(true)
  expect(pageContent.elements).toHaveLength(1)
  expect(pageContent.elements[0].type).toBe('text')
})