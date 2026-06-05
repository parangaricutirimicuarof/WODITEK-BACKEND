import { Router } from "express";
import Replicate from "replicate";
import fs from "fs";
import path from "path";

const router = Router();
const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// Endpoint para generar el corte de cabello
router.post("/generate-haircut", async (req, res) => {
    try {
        const { image, prompt } = req.body;
        
        let infoImagen = "Ninguna";
        if (image) {
            if (image.includes("/garrison/uploads/")) {
                infoImagen = `Archivo: ${image.split("/").pop()}`;
            } else {
                infoImagen = `[Base64 o URL de ${image.length} caracteres]`;
            }
        }

        console.log("--- SOLICITUD DE GENERACIÓN DE RECORTE (MODO DIRECTO) ---");
        console.log("Estilo solicitado (Enum):", prompt);
        console.log("Imagen recibida:", infoImagen);

        if (!image || !prompt) {
            return res.status(400).json({ error: "Se requiere la imagen y el nombre del estilo oficial de FLUX." });
        }

        // Asegurar que la imagen sea una URL o Data URI válida para el frontend
        let imageUri = image;
        if (!image.startsWith('data:image/') && !image.startsWith('http')) {
            imageUri = `data:image/jpeg;base64,${image}`;
        }

        // Determinar qué enviar a Replicate: URL o Buffer (mejor que Base64 largo)
        let inputForReplicate = image;
        if (!image.startsWith("http")) {
            const base64Clean = image.includes(";base64,") ? image.split(";base64,").pop() : image;
            inputForReplicate = Buffer.from(base64Clean, "base64");
        }

        console.log(`Llamando a Replicate con el estilo exacto: ${prompt}...`);
        
        const output = await replicate.run(
            "flux-kontext-apps/change-haircut:4e98896183ea9c9160b185b617f768d7316a1397fe0a9ed822cee02122311f67",
            {
                input: {
                    input_image: inputForReplicate,
                    haircut: prompt,
                    hair_color: "No change",
                    guidance_scale: 3,
                    steps: 25,
                }
            }
        );

        const resultImageUrl = Array.isArray(output) ? output[0] : output;
        console.log("Corte generado exitosamente:", resultImageUrl);

        // Convertir el resultado a Base64 para el retorno
        const imageResponse = await fetch(resultImageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Generado = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString('base64')}`;
            
        console.log("Respuesta final lista para el frontend.");
        
        // --- COMUNICACIÓN EN TIEMPO REAL PARA LA TV ---
        // Emitimos el resultado a todos los conectados (TV, tablets, etc)
        if (req.io) {
            req.io.emit('new-haircut-result', {
                originalImage: imageUri,
                resultImage: base64Generado,
                styleName: prompt
            });
            console.log("Evento enviado a la TV vía WebSockets.");
        }
        
        console.log("-------------------------------------------");

        return res.status(200).json({ resultImage: base64Generado });

    } catch (err) {
        console.error("Error en BarberAI (/generate-haircut):", err);
        return res.status(500).json({
            error: "Error al procesar el cambio de look con FLUX.",
            details: err.message
        });
    }
});

// Nota: El endpoint /generate-prompt ha sido ELIMINADO para optimizar velocidad y precisión.

export default router;
