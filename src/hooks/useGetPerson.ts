import { useMutation } from '@tanstack/react-query';
import { baseURL } from '@/utils/api';
import type { CandidateUser, PersonResponse } from '@/types/chat';

export function useGetPerson() {
  return useMutation({
    mutationFn: async (user: CandidateUser): Promise<CandidateUser> => {
      const response = await fetch(`${baseURL}users/getPersonById`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: { _id: user._id } }),
      });

      const json = (await response.json().catch(() => ({}))) as PersonResponse;

      if (!response.ok || json.type !== 'person' || json.status !== 'OK' || !json.data) {
        throw new Error('Identity verification failed. Please register at BOTCIERGE.com.');
      }

      return { ...json.data, _id: user._id };
    },
  });
}
