 // import axios from 'axios';
 
import { useQuery } from '@tanstack/react-query';
import { Member } from '../types';
import agent from '../api/agent';


export const useMembers = () => {

 
  const { data: members, isPending } = useQuery<Member[], Error>({
    queryKey: ['members'],
    queryFn: async () => {
      const response = await agent.Members.list();
      return response;
    }
  });

  return { members , isPending}
}
