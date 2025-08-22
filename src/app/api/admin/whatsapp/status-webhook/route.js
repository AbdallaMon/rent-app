import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStatus, trackIncomingMessage } from '@/lib/whatsapp-analytics';

// This webhook handler is for capturing message status updates and incoming messages from Meta WhatsApp Business API
export async function POST(request) {
  try {
    // Get the verification token from environment variables
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    // Parse the request body
    const body = await request.json();
    console.log('Received WhatsApp webhook:', JSON.stringify(body));

    // Check if this is a status update
    if (body.entry && 
        body.entry[0]?.changes && 
        body.entry[0]?.changes[0]?.value?.statuses) {
      
      const statuses = body.entry[0].changes[0].value.statuses;
      
      // Process each status update
      for (const statusUpdate of statuses) {
        const messageId = statusUpdate.id;
        const status = statusUpdate.status; // delivered, read, failed
        
        // Update the message status in our database
        try {
          await updateMessageStatus(messageId, status);
          console.log(`Updated message status for ${messageId} to ${status}`);
        } catch (error) {
          console.error(`Error updating message status for ${messageId}:`, error);
        }
      }
    }
    
    // Check if this is an incoming message
    if (body.entry && 
        body.entry[0]?.changes && 
        body.entry[0]?.changes[0]?.value?.messages) {
      
      const messages = body.entry[0].changes[0].value.messages;
      const contacts = body.entry[0].changes[0].value.contacts || [];
      
      // Process each incoming message
      for (const message of messages) {
        // Get the contact information
        const contact = contacts.find(c => c.wa_id === message.from);
        
        try {
          // Extract message content based on type
          let content = '';
          let type = message.type;
          
          if (message.text) {
            content = message.text.body;
          } else if (message.interactive) {
            type = 'interactive';
            const interactive = message.interactive;
            
            if (interactive.button_reply) {
              content = `Button: ${interactive.button_reply.id}`;
            } else if (interactive.list_reply) {
              content = `List: ${interactive.list_reply.id}`;
            }
          }
          
          // Track the incoming message
          await trackIncomingMessage({
            messageId: message.id,
            from: message.from,
            type: type,
            body: content,
            language: null, // Will be detected by language utils if needed
            metadata: {
              timestamp: message.timestamp,
              contactName: contact?.profile?.name || null,
              contactWaId: contact?.wa_id || null
            }
          });
          
          console.log(`Tracked incoming message ${message.id} from ${message.from}`);
        } catch (error) {
          console.error(`Error tracking incoming message ${message.id}:`, error);
        }
      }
    }

    // Return a success response
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in status webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error processing webhook' },
      { status: 500 }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request) {
  try {
    // Get the verification token from environment variables
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    // Get the URL parameters
    const searchParams = new URL(request.url).searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    
    // Check if this is a verification request
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully');
      return new Response(challenge, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    // If verification fails, return an error
    console.error('Webhook verification failed');
    return new Response('Verification failed', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain'
      }
    });
  } catch (error) {
    console.error('Error in webhook verification:', error);
    return NextResponse.json(
      { error: 'Internal server error during verification' },
      { status: 500 }
    );
  }
}
