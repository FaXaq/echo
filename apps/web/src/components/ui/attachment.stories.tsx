import type { Meta, StoryObj } from "@storybook/react";
import { FileText, ImageIcon, XIcon } from "lucide-react";
import {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentAction,
  AttachmentTrigger,
} from "@/components/ui/attachment";
import { Spinner } from "@/components/ui/spinner";

const meta = {
  title: "UI/Attachment",
  component: Attachment,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
} satisfies Meta<typeof Attachment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Attachment className="w-64">
      <AttachmentTrigger aria-label="Open setlist.pdf" />
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>setlist.pdf</AttachmentTitle>
        <AttachmentDescription>84 KB</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  ),
};

export const Uploading: Story = {
  render: () => (
    <Attachment state="uploading" className="w-64">
      <AttachmentMedia>
        <Spinner />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>demo.mp3</AttachmentTitle>
        <AttachmentDescription>Uploading…</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const Error: Story = {
  render: () => (
    <Attachment state="error" className="w-64">
      <AttachmentMedia>
        <FileText />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>cover.png</AttachmentTitle>
        <AttachmentDescription>Couldn't load this file</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Attachment orientation="vertical">
      <AttachmentTrigger aria-label="Open cover.png" />
      <AttachmentMedia variant="image">
        <ImageIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>cover.png</AttachmentTitle>
        <AttachmentDescription>245 KB</AttachmentDescription>
      </AttachmentContent>
    </Attachment>
  ),
};

export const Group: Story = {
  render: () => (
    <AttachmentGroup className="w-96">
      <Attachment orientation="vertical">
        <AttachmentTrigger aria-label="Open cover.png" />
        <AttachmentMedia variant="image">
          <ImageIcon />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>cover.png</AttachmentTitle>
          <AttachmentDescription>245 KB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
      <Attachment orientation="vertical">
        <AttachmentTrigger aria-label="Open setlist.pdf" />
        <AttachmentMedia>
          <FileText />
        </AttachmentMedia>
        <AttachmentContent>
          <AttachmentTitle>setlist.pdf</AttachmentTitle>
          <AttachmentDescription>84 KB</AttachmentDescription>
        </AttachmentContent>
      </Attachment>
    </AttachmentGroup>
  ),
};
