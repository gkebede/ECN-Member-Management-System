import {
  Typography,
  Container,
  CardContent,
  CardActions,
  Box,
  ListItem,
  Card,
  Grid,
  List,
  Chip,
  CardHeader
} from '@mui/material';
 // import SideDrawer from './SideDrawer';


  function  Contact(){
 
  return (
    <Container  maxWidth="lg" sx={{ padding: '2rem', backgroundColor: '#f5f5f5' }}>
      <Grid size={9} sx={{  margin: '5rem auto',backgroundColor:'lightgray' }}>
          <List sx={{display: 'flex', justifyContent: 'space-between'}}>
              <ListItem>
                  <Card sx={{ borderRadius: 3, margin:'5rem auto', padding:'.1rem',minWidth: '40rem' }}>
                      <Box>
                          <CardContent>
                          <CardHeader
    title="Explore the ECN Network"
  
    sx={{
      backgroundColor: '#0d1b2a',
      color: 'white',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
    }}
  />
                              <Typography variant='h5'>Phon:614-xxx-xxxx</Typography>
                              <Typography variant='h5'>Email: bob@example.com</Typography>
                              <Typography variant='h5'>FAX: 614-xxx-xxxx</Typography>
                               
                          </CardContent>
                          <CardActions sx={{ display: 'flex', justifyContent: 'space-between',  pb: 2 }}>
                              <Chip label="Tell us what you think" variant='outlined' sx={{backgroundColor:'orangered', color:'white', fontSize: 18, textTransform:'uppercase', fontWeight:700}} />
                               
                          </CardActions>
                           
                      </Box>
                  </Card>
              </ListItem>
          </List>
          {/* <SideDrawer />  */}
      </Grid>
      </Container>
  );
}

 

export default Contact;
