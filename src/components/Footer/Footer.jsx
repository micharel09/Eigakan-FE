const Footer = () => {
  return (
    <footer className="w-full bg-black text-white border-t border-gray-800">
      <div className="container mx-auto md:px-8 md:py-0">
        <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by{" "}
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-4"
            >
              SP25-group5-475-Eigakan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export { Footer as default };
