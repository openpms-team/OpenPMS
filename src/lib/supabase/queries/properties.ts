import { createClient } from '@/lib/supabase/server'
import type { Property, PropertyInsert, PropertyUpdate } from '@/types/database'

export async function getProperties(): Promise<Property[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Property[]
}

export async function getProperty(id: string): Promise<Property | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*, tax_jurisdictions(*), owners(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data as Property
}

export async function createProperty(
  propertyData: PropertyInsert
): Promise<Property> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .insert(propertyData)
    .select()
    .single()

  if (error) throw error
  return data as Property
}

export async function updateProperty(
  id: string,
  propertyData: PropertyUpdate
): Promise<Property> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('properties')
    .update(propertyData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Property
}

export async function deleteProperty(id: string): Promise<void> {
  const supabase = await createClient()

  // Check for active reservations
  const { count } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', id)
    .in('status', ['confirmed', 'checked_in'])

  if (count && count > 0) {
    throw new Error('Cannot delete property with active reservations')
  }

  const { error } = await supabase
    .from('properties')
    .update({ active: false })
    .eq('id', id)

  if (error) throw error
}
