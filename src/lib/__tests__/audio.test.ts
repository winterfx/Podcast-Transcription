import { describe, it, expect } from 'vitest'
import { getFileExtension, isSupportedExtension, getSupportedExtensions } from '../audio'

describe('getFileExtension', () => {
  it('提取直接文件路径扩展名', () => {
    expect(getFileExtension('audio.mp3')).toBe('mp3')
    expect(getFileExtension('/path/to/file.wav')).toBe('wav')
  })

  it('处理带查询参数的URL', () => {
    expect(getFileExtension('https://example.com/audio.mp3?token=abc')).toBe('mp3')
  })

  it('处理带碎片的URL', () => {
    expect(getFileExtension('https://example.com/audio.m4a#section')).toBe('m4a')
  })

  it('不支持的扩展名返回默认值mp3', () => {
    expect(getFileExtension('file.xyz')).toBe('mp3')
    expect(getFileExtension('noextension')).toBe('mp3')
  })

  it('支持所有常见音频格式', () => {
    expect(getFileExtension('test.ogg')).toBe('ogg')
    expect(getFileExtension('test.aac')).toBe('aac')
    expect(getFileExtension('test.flac')).toBe('flac')
    expect(getFileExtension('test.webm')).toBe('webm')
  })
})

describe('isSupportedExtension', () => {
  it('支持的格式返回true', () => {
    expect(isSupportedExtension('mp3')).toBe(true)
    expect(isSupportedExtension('wav')).toBe(true)
    expect(isSupportedExtension('m4a')).toBe(true)
  })

  it('不支持的格式返回false', () => {
    expect(isSupportedExtension('xyz')).toBe(false)
    expect(isSupportedExtension('doc')).toBe(false)
  })

  it('大小写不敏感', () => {
    expect(isSupportedExtension('MP3')).toBe(true)
    expect(isSupportedExtension('WAV')).toBe(true)
  })
})

describe('getSupportedExtensions', () => {
  it('返回完整的支持格式列表', () => {
    const extensions = getSupportedExtensions()
    expect(extensions).toContain('mp3')
    expect(extensions).toContain('wav')
    expect(extensions).toContain('m4a')
    expect(extensions).toContain('ogg')
    expect(extensions).toContain('aac')
    expect(extensions).toContain('flac')
  })

  it('返回副本，防止修改原数组', () => {
    const extensions1 = getSupportedExtensions()
    const extensions2 = getSupportedExtensions()
    expect(extensions1).not.toBe(extensions2)
    expect(extensions1).toEqual(extensions2)
  })
})
