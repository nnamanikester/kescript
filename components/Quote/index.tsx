import Image from "next/image";
import * as React from "react";

interface QuoteProps {
  name: string;
  title: string;
  text: string;
  photo: any;
}

const Quote: React.FC<QuoteProps> = ({ name, title, text, photo }) => {
  return (
    <>
      <div className="quote">
        <p className="text">{text}</p>
        <div className="avatar">
          <Image src={photo} alt="Reference Photo" width={200} height={200} />
        </div>
        <h3 className="name">{name}</h3>
        <p className="title">{title}</p>
      </div>
    </>
  );
};

export default Quote;
