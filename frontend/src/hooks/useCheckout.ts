import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../utils/apiClient';
import { useNotification } from '../context/NotificationContext';
import type { Appointment } from '../types';

export function useCheckout(selectedBranch: string) {
  const { showToast } = useNotification();
  const queryClient = useQueryClient();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
  const [isLoadingAppt, setIsLoadingAppt] = useState(false);

  const checkoutMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        paymentMethod: 'CASH' | 'CARD' | 'GCASH';
        discountAmount: number;
        pointsApplied?: number;
        employeeId?: string | null;
      };
    }) => apiClient.post(`/api/appointments/${id}/checkout`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['waitlist', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', selectedBranch] });
      queryClient.invalidateQueries({ queryKey: ['financials', selectedBranch] });
      showToast('Checkout completed and transaction recorded successfully.', 'success');
      setIsCheckoutOpen(false);
      setCheckoutAppt(null);
    },
    onError: (err: Error) => {
      showToast(err.message, 'error');
    },
  });

  const openCheckout = useCallback((appt: Appointment) => {
    setCheckoutAppt(appt);
    setIsCheckoutOpen(true);
  }, []);

  const openCheckoutById = useCallback(
    async (id: string) => {
      setIsLoadingAppt(true);
      try {
        const data = await apiClient.get<Appointment>(`/api/appointments/${id}`);
        setCheckoutAppt(data);
        setIsCheckoutOpen(true);
      } catch (err) {
        const error = err as Error;
        showToast(error.message || 'Error occurred while loading checkout details.', 'error');
      } finally {
        setIsLoadingAppt(false);
      }
    },
    [showToast]
  );

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutAppt(null);
  }, []);

  const submitCheckout = useCallback(
    (payload: {
      paymentMethod: 'CASH' | 'CARD' | 'GCASH';
      discountAmount: number;
      pointsApplied?: number;
      employeeId?: string | null;
    }) => {
      if (!checkoutAppt) return;
      checkoutMutation.mutate({ id: checkoutAppt.id, payload });
    },
    [checkoutAppt, checkoutMutation]
  );

  return {
    isCheckoutOpen,
    checkoutAppt,
    isLoadingAppt,
    isPending: checkoutMutation.isPending,
    openCheckout,
    openCheckoutById,
    closeCheckout,
    submitCheckout,
  };
}
