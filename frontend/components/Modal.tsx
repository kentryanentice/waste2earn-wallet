import { Fragment } from "react";
import * as Dialog from "@radix-ui/react-dialog";

interface ModalProps {
  open: boolean;
  width?: string;
  height?: string;
  top?: string;
  background?: string;
  padding?: string;
  rounded?: string;
  text?: string;
  border?: string;
  children: any;
}

const Modal = ({
  open,
  width = "100%",
  height = "",
  top = "top-[50%]",
  text = "text-PrimaryTextColorLight dark:text-PrimaryTextColor",
  background = "bg-PrimaryColorLight dark:bg-PrimaryColor",
  padding = "p-6",
  rounded = "rounded-lg",
  border = "",
  children,
}: ModalProps) => {
  return (
    <Fragment>
      <Dialog.Root open={open}>
        <Dialog.Portal>
          <Dialog.Overlay className="DialogContent" />
          <Dialog.Content className={`fixed ${top} left-[50%] outline-none shadow-md z-[2000] `}>
            <div
              className={`absolute flex flex-col justify-start items-start text-lg ${width} ${height}  ${background} ${padding} ${rounded} ${text} ${border}`}
            >
              {children}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Fragment>
  );
};

export default Modal;
