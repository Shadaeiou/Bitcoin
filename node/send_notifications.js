const fs               = require('fs')
const db               = require('./db')
const Notification     = require('./controllers/notification')
const User             = require('./controllers/user')
const nodemailer       = require('nodemailer')
const pw               = fs.readFileSync('/etc/ni/gmail_pw.txt').toString().trim()
const fromEmail        = 'burke.blazer@gmail.com'

class SendNotifications {
    async run() {
    	var notifications = await Notification.get({sent: false});

    	for (var ct = 0; ct < notifications.length; ct++) {
    		var user = await User.getByID(notifications[ct].user_id);

	        // setup e-mail data with unicode symbols
	        var mailOptions = {
	            from:    fromEmail,
	            to:      user.email,
	            subject: "Cryp.to Notification",
	            text:    notifications[ct].text
	        }

	        var smtpTransport = nodemailer.createTransport({
			    host:       'smtp.gmail.com',
			    port:       587,
			    secure:     false,
			    requireTLS: true,
			    auth: {
			        user: fromEmail,
			        pass: pw
			    }
			});

	        // send mail with defined transport object
	        smtpTransport.sendMail(mailOptions, function(error, response){
	            smtpTransport.close(); // shut down the connection pool, no more messages
	        });

	        Notification.update({notification_id: notifications[ct].notification_id, sent: true});
    	}

    	return notifications
    }
}

module.exports = new SendNotifications()