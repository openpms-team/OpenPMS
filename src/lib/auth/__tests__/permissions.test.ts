import { describe, it, expect } from 'vitest'
import { hasPermission, getAllowedResources } from '../permissions'

describe('permissions', () => {
  describe('admin', () => {
    it('has all permissions', () => {
      expect(hasPermission('admin', 'properties.read')).toBe(true)
      expect(hasPermission('admin', 'finance.write')).toBe(true)
      expect(hasPermission('admin', 'settings.manage')).toBe(true)
    })
  })

  describe('cleaner', () => {
    it('can access own tasks', () => {
      expect(hasPermission('cleaner', 'tasks.own')).toBe(true)
    })

    it('can read properties', () => {
      expect(hasPermission('cleaner', 'properties.read')).toBe(true)
    })

    it('cannot access finance', () => {
      expect(hasPermission('cleaner', 'finance.read')).toBe(false)
    })

    it('cannot manage reservations', () => {
      expect(hasPermission('cleaner', 'reservations.write')).toBe(false)
    })
  })

  describe('receptionist', () => {
    it('can manage reservations', () => {
      expect(hasPermission('receptionist', 'reservations.read')).toBe(true)
      expect(hasPermission('receptionist', 'reservations.write')).toBe(true)
    })

    it('can read tasks but not edit others', () => {
      expect(hasPermission('receptionist', 'tasks.read')).toBe(true)
      expect(hasPermission('receptionist', 'tasks.own')).toBe(true)
    })

    it('cannot access finance', () => {
      expect(hasPermission('receptionist', 'finance.read')).toBe(false)
    })
  })

  describe('manager', () => {
    it('can manage team (read only)', () => {
      expect(hasPermission('manager', 'team.read')).toBe(true)
    })

    it('can manage finance', () => {
      expect(hasPermission('manager', 'finance.read')).toBe(true)
    })

    it('can manage all tasks', () => {
      expect(hasPermission('manager', 'tasks.write')).toBe(true)
    })
  })

  describe('owner', () => {
    it('can read properties and finance', () => {
      expect(hasPermission('owner', 'properties.read')).toBe(true)
      expect(hasPermission('owner', 'finance.read')).toBe(true)
    })

    it('cannot write properties', () => {
      expect(hasPermission('owner', 'properties.write')).toBe(false)
    })
  })

  describe('getAllowedResources', () => {
    it('returns all resources for admin', () => {
      const resources = getAllowedResources('admin')
      expect(resources).toContain('properties')
      expect(resources).toContain('finance')
      expect(resources.length).toBeGreaterThanOrEqual(9)
    })

    it('returns limited resources for cleaner', () => {
      const resources = getAllowedResources('cleaner')
      expect(resources).toContain('tasks')
      expect(resources).toContain('properties')
      expect(resources).not.toContain('finance')
    })
  })
})
