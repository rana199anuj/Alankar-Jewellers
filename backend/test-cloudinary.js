const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'alankar-jewellers',
  api_key: '899141652323614',
  api_secret: 'zSlNCFXMj5FR9umPXHvBIyc4sqQ'
});

cloudinary.api.ping(function(error, result) {
  if (error) {
    console.error("PING ERROR:", error);
  } else {
    console.log("PING SUCCESS:", result);
  }
});
