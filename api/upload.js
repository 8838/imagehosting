const { createReadStream } = require('fs');
const formidable = require('formidable');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const form = new formidable.IncomingForm();
  
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing form data' });
    }
    
    if (!files.image) {
      return res.status(400).json({ error: 'No image data provided' });
    }
    const imageFile = files.image;
    
    // Create form data for the external API
    const formData = new FormData();
    formData.append('key', '6d207e02198a847aa98d0a2a901485a5');
    formData.append('source', fs.createReadStream(imageFile.filepath));
    formData.append('format', 'json');
    try {
      // Make request to the image hosting API
      const response = await fetch('https://freeimage.host/api/1/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      // Clean up the temp file
      fs.unlink(imageFile.filepath, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
      // Process the response
      if (result.status_code === 200 && result.image && result.image.url) {
        return res.status(200).json({ url: result.image.url });
      } else {
        const errorMsg = result.error && result.error.message ? result.error.message : 'Upload failed';
        return res.status(500).json({ error: errorMsg });
      }
    } catch (error) {
      console.error('Error with upload API:', error);
      return res.status(500).json({ 
        error: 'An error occurred during upload', 
        details: error.message 
      });
    }
  });
};
