"use client";

import { BalanceCards } from './balance_cards';
import WizardInput from './wizard-input';
import { useQuery } from '@tanstack/react-query';
import { getBalanceSummary } from '@/features/transaction/action';

export default function DashboardContent() {
   const { data, error, refetch } = useQuery({
      queryKey: ['balance'],
      queryFn: () => getBalanceSummary(),
   });

   return (
      <section id="content" className="space-y-4">
         <WizardInput refetch={refetch} />
         <BalanceCards data={data} error={error} />
      </section>
   );
}