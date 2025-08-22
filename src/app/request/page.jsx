import { redirect } from 'next/navigation';

const Request = () => {
  // Redirect to /request/maintenance
  redirect('/request/maintenance');

  // This return statement is optional since the redirect will happen before rendering
  return null;
};

export default Request;
