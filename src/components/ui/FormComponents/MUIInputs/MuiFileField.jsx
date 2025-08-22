import { Controller } from "react-hook-form";
import { TextField } from "@mui/material";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function MuiFileField({
                                         control,
                                         input,
                                         register,
                                         errors,
                                         variant,
                                     }) {
    const {  id, label } = input.data;
    const [preview, setPreview] = useState(input.value || null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    return (
          <div className="flex gap-5">
              <Controller
                    name={label}
                    control={control}
                    render={({ field:{onChange,value=input.value} }) => (
                          <TextField
                                label={label}
                                id={id}
                                type="file"
                                InputLabelProps={{ shrink: true }}
                                {...register(id, input.pattern)}
                                error={Boolean(errors[id])}
                                helperText={errors[id]?.message}
                                variant={variant}
                                fullWidth
                                value={value}
                                accept={input.data.accept}
                                onChange={(e) => {
                                    onChange(e); // default handler
                                    handleFileChange(e); // our handler
                                }}
                          />
                    )}
              />
              {preview && <Image src={preview} alt="Preview" width={100} height={100} />}
          </div>
    );
}
