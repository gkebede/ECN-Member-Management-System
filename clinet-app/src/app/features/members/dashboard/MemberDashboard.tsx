
//import MemberList from '../../../../component/MebmerList'
// import { Grid2, List, ListItem } from '@mui/material'
// import { Member } from '../../../lib/types';
import { useEffect } from 'react';
// import { useStore } from '../../../app/stores/store';
import { observer } from 'mobx-react-lite';
import { useStore } from '../../../stores/store';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import MemberList from '../../../../../component/MebmerList';

 
const MemberDashboard = observer(() => {
  const { memberStore } = useStore();
  const { loadAllMembers, members, loadingInitial } = memberStore;

  useEffect(() => {
    // Load members once on mount
    loadAllMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  if (loadingInitial) {
    return (
      <Grid container justifyContent="center" alignItems="center" sx={{ minHeight: '50vh' }}>
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={60} />
            <Typography variant="h6">Loading members...</Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    <Grid container>
      <Grid>
        <List>
          <ListItem>
            <MemberList members={members} />
          </ListItem>
        </List>
      </Grid>
    </Grid>
  );
});


export default MemberDashboard;



 
 
   
  //  const handdleSelectMember = (id: string)=> {
      
  //    setselectedMember(members.find((member) => member.id === id) ?? null);
  //    if (id) {
  //      setEditMode(true);
  //      //setselectedMember(members.find((member) => member.id === id) ?? null);
  //      navigate(`/card/${id}`);
  
  //    }
  //  };
   
  //  const handdleCancelSelectMember = ()=> {
  //    setselectedMember(null);
  //  };
   
  //  const handleFormOpen = (id?: string)=> {
  //    if (id) {
  //      handdleSelectMember(id);
  //    }else {
  //      handdleCancelSelectMember();
  //      setEditMode(true);
  //    }
  //  };
 
  //  const handleCloseForm = () => {
  //    setEditMode(false);
  //  };

  //const [selectedId, setSelectedId] = useState<string | null>(null);

  // Example: in MemberList, when a member is clicked:
 // onClick={() => setSelectedId(member.id)}
  
