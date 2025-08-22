import {NextResponse} from "next/server";
import fs from 'fs';
import {pipeline} from 'stream';
import {promisify} from 'util';
import {v4 as uuidv4} from 'uuid';

const pump = promisify(pipeline);

export const dynamic = 'force-dynamic'; // Ensures that the route is dynamic


export async function POST(req, res) {
    try {
        const formData = await req.formData();
        const file = formData.getAll('file')[0];
        const uniqueName = uuidv4() + '-' + file.name;  // Generating a unique name
        const filePath = `./public/files/${uniqueName}`;

        await pump(file.stream(), fs.createWriteStream(filePath));

        return NextResponse.json({status: 200, url: uniqueName, message: "File uploaded successfully"});
    } catch (e) {
        console.log(e);
        return NextResponse.json({status: 400, data: e, message: "Error uploading file"});
    }
}
