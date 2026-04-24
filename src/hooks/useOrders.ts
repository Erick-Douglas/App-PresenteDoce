import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  const fetchUserOrders = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data && !error) setOrders(data);
  }, []);

  return { orders, fetchUserOrders };
}
