import { describe, it, expect } from 'vitest'
import { formatSrtTime, convertSegmentsToSrtEntries, entriesToSrtString } from '../srt'
import { WhisperSegment } from '../types'

describe('formatSrtTime', () => {
  it('将秒数转换为SRT时间格式', () => {
    expect(formatSrtTime(0)).toBe('00:00:00,000')
    expect(formatSrtTime(65.5)).toBe('00:01:05,500')
    expect(formatSrtTime(3661.123)).toBe('01:01:01,123')
  })

  it('处理小数秒的毫秒', () => {
    expect(formatSrtTime(1.001)).toBe('00:00:01,001')
    expect(formatSrtTime(1.999)).toBe('00:00:01,999')
  })

  it('正确填充零', () => {
    expect(formatSrtTime(1)).toBe('00:00:01,000')
    expect(formatSrtTime(61)).toBe('00:01:01,000')
  })

  it('处理超过1小时的时间', () => {
    expect(formatSrtTime(3600)).toBe('01:00:00,000')
    expect(formatSrtTime(7261.5)).toBe('02:01:01,500')
  })
})

describe('convertSegmentsToSrtEntries', () => {
  const createMockSegment = (id: number, start: number, end: number, text: string): WhisperSegment => ({
    id,
    seek: 0,
    start,
    end,
    text,
    tokens: [],
    temperature: 0,
    avg_logprob: 0,
    compression_ratio: 0,
    no_speech_prob: 0
  })

  const mockSegments: WhisperSegment[] = [
    createMockSegment(0, 0, 5, ' Hello '),
    createMockSegment(1, 5, 10, ' World '),
  ]

  it('转换单个分块的segments', () => {
    const entries = convertSegmentsToSrtEntries(mockSegments, 0, 300, 1)
    expect(entries).toHaveLength(2)
    expect(entries[0].index).toBe(1)
    expect(entries[0].startTime).toBe(0)
    expect(entries[0].text).toBe('Hello')
  })

  it('计算多分块的时间偏移', () => {
    const entries = convertSegmentsToSrtEntries(mockSegments, 1, 300, 1)
    expect(entries[0].startTime).toBe(300) // 0 + 1*300
    expect(entries[0].endTime).toBe(305)   // 5 + 1*300
  })

  it('保持索引连续性', () => {
    const entries = convertSegmentsToSrtEntries(mockSegments, 0, 300, 5)
    expect(entries[0].index).toBe(5)
    expect(entries[1].index).toBe(6)
  })

  it('去除文本首尾空格', () => {
    const entries = convertSegmentsToSrtEntries(mockSegments, 0, 300, 1)
    expect(entries[0].text).toBe('Hello')
    expect(entries[1].text).toBe('World')
  })

  it('处理空segments数组', () => {
    const entries = convertSegmentsToSrtEntries([], 0, 300, 1)
    expect(entries).toHaveLength(0)
  })
})

describe('entriesToSrtString', () => {
  it('将单个条目格式化为SRT', () => {
    const entries = [{ index: 1, startTime: 0, endTime: 5, text: 'Hello' }]
    const result = entriesToSrtString(entries)
    expect(result).toContain('1')
    expect(result).toContain('00:00:00,000 --> 00:00:05,000')
    expect(result).toContain('Hello')
  })

  it('正确连接多个条目', () => {
    const entries = [
      { index: 1, startTime: 0, endTime: 5, text: 'Hello' },
      { index: 2, startTime: 5, endTime: 10, text: 'World' },
    ]
    const result = entriesToSrtString(entries)
    expect(result).toContain('1\n')
    expect(result).toContain('2\n')
  })

  it('处理中文文本', () => {
    const entries = [{ index: 1, startTime: 0, endTime: 5, text: '你好世界' }]
    const result = entriesToSrtString(entries)
    expect(result).toContain('你好世界')
  })

  it('处理空条目数组', () => {
    const result = entriesToSrtString([])
    expect(result).toBe('')
  })

  it('生成标准SRT格式', () => {
    const entries = [{ index: 1, startTime: 0, endTime: 5, text: 'Test' }]
    const result = entriesToSrtString(entries)
    const lines = result.split('\n')
    expect(lines[0]).toBe('1')
    expect(lines[1]).toBe('00:00:00,000 --> 00:00:05,000')
    expect(lines[2]).toBe('Test')
  })
})
